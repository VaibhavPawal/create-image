import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const VALID_ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);
const VALID_QUALITIES = new Set(['standard', 'high']);
const VALID_COUNTS = new Set([1, 2, 4]);

const STYLE_DIRECTIVES: Record<string, string> = {
  'Realistic Photography':
    'photorealistic studio and natural photography, crisp optical focus, authentic lighting, rich micro-detail, medium format camera aesthetic',
  '3D Render':
    'high-end 3D sculptural render, physically based materials, realistic global illumination, crisp reflections, Cinema 4D and Octane quality',
  Anime:
    'refined Japanese anime film artwork, expressive cel-shaded lighting, vibrant atmospheric backgrounds, crisp linework, feature-film animation quality',
  Cyberpunk:
    'futuristic cyberpunk atmosphere, rain-slicked reflections, architectural neon accents in violet and cyan, moody cinematic depth, high detail',
  'Digital Art':
    'masterwork contemporary digital illustration, refined brushwork, rich atmospheric perspective, dramatic studio color harmony',
  Cartoon:
    'stylized modern illustrated cartoon art, clean bold silhouettes, expressive shapes, vibrant cohesive palette, crisp polished finish',
  Fantasy:
    'epic high-fantasy concept matte painting, majestic scale, atmospheric twilight shafts, intricate environmental storytelling, fine-art quality',
  Cinematic:
    'cinematic anamorphic film still, dramatic rim lighting, shallow depth of field, curated color grading, theatrical production design',
  Watercolor:
    'fine art watercolor painting on textured cold-pressed cotton paper, delicate pigment washes, luminous translucent layers, organic brushstrokes',
};

const VARIATION_ANGLES = [
  'balanced primary hero composition',
  'distinct secondary camera perspective with fresh lighting interplay',
  'dramatic wide environmental framing with heightened atmospheric depth',
  'intimate sculpted close-focus angle emphasizing surface textures',
];

function isApiKeyConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return false;
  if (key === 'MY_GEMINI_API_KEY' || key.length < 10) return false;
  return true;
}

function createGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ParsedUpstreamError {
  status: number;
  code: string;
  error: string;
  instructions: string;
}

function classifyGeminiError(err: unknown): ParsedUpstreamError {
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key') ||
    lower.includes('permission_denied') ||
    lower.includes('403')
  ) {
    return {
      status: 403,
      code: 'API_KEY_INVALID',
      error: 'The configured Gemini API key was rejected or lacks permission for image generation.',
      instructions:
        'Open Settings > Secrets in AI Studio and attach a valid, billing-enabled GEMINI_API_KEY.',
    };
  }

  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('billing')
  ) {
    return {
      status: 429,
      code: 'QUOTA_EXHAUSTED',
      error: 'Gemini image generation quota exceeded or billing is required for this model.',
      instructions:
        'Gemini image models require a billing-enabled API key. Select a paid API key in Settings > Secrets or retry shortly.',
    };
  }

  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      error: 'The requested Gemini image model is currently unavailable for this API key.',
      instructions:
        'Verify your GEMINI_API_KEY in Settings > Secrets has access to Gemini image generation models.',
    };
  }

  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('prohibited')) {
    return {
      status: 400,
      code: 'CONTENT_FILTERED',
      error: 'The prompt was filtered by safety policies and could not be rendered.',
      instructions: 'Try adjusting your prompt wording and generating again.',
    };
  }

  return {
    status: 502,
    code: 'GENERATION_FAILED',
    error: rawMessage || 'Image generation failed due to an upstream error.',
    instructions: 'Check your connection and GEMINI_API_KEY configuration, then try again.',
  };
}

function isRetryableError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('500') ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('econnreset')
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateSingleImage(
  ai: GoogleGenAI,
  params: {
    prompt: string;
    style: string;
    aspectRatio: string;
    quality: 'standard' | 'high';
    variationIndex: number;
    totalCount: number;
  }
): Promise<{ dataUrl: string; model: string }> {
  const model =
    params.quality === 'high'
      ? 'gemini-nano-banana-2.1'
      : 'gemini-3.1-flash-lite-image';

  const styleGuide = STYLE_DIRECTIVES[params.style] ?? STYLE_DIRECTIVES['Digital Art'];
  const variationHint =
    params.totalCount > 1
      ? ` Visual variation ${params.variationIndex + 1}: ${VARIATION_ANGLES[params.variationIndex % VARIATION_ANGLES.length]}.`
      : '';

  const enrichedPrompt = `${params.prompt.trim()}. Artistic direction: ${styleGuide}.${variationHint} High visual fidelity, no watermarks, no embedded UI text.`;

  const imageConfig: Record<string, string> = {
    aspectRatio: params.aspectRatio,
  };
  if (params.quality === 'high') {
    imageConfig.imageSize = '2K';
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: enrichedPrompt }],
        },
        config: {
          imageConfig,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          return {
            dataUrl: `data:${mime};base64,${part.inlineData.data}`,
            model,
          };
        }
      }

      const textFallback = parts
        .map((p) => p.text)
        .filter(Boolean)
        .join(' ')
        .trim();

      throw new Error(
        textFallback
          ? `Model returned text instead of an image: ${textFallback}`
          : 'No image data was returned by the model. Try refining your prompt.'
      );
    } catch (err) {
      lastError = err;
      if (attempt === 0 && isRetryableError(err)) {
        await sleep(750);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      apiConfigured: isApiKeyConfigured(),
    });
  });

  app.post('/api/generate', async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const style =
      typeof body.style === 'string' && body.style in STYLE_DIRECTIVES
        ? body.style
        : 'Digital Art';
    const aspectRatio =
      typeof body.aspectRatio === 'string' && VALID_ASPECT_RATIOS.has(body.aspectRatio)
        ? body.aspectRatio
        : '1:1';
    const quality: 'standard' | 'high' =
      typeof body.quality === 'string' && VALID_QUALITIES.has(body.quality)
        ? (body.quality as 'standard' | 'high')
        : 'standard';
    const count =
      typeof body.count === 'number' && VALID_COUNTS.has(body.count) ? body.count : 1;

    if (!prompt) {
      res.status(400).json({
        code: 'INVALID_PROMPT',
        error: 'Please enter a prompt describing the image you want to create.',
        instructions: 'Write a short visual description and try again.',
      });
      return;
    }

    if (prompt.length > 1200) {
      res.status(400).json({
        code: 'PROMPT_TOO_LONG',
        error: 'Prompt exceeds the 1,200 character limit.',
        instructions: 'Shorten your prompt and try again.',
      });
      return;
    }

    if (!isApiKeyConfigured()) {
      res.status(503).json({
        code: 'API_KEY_MISSING',
        error: 'Gemini API key is not configured on the server.',
        instructions:
          'Configure a billing-enabled GEMINI_API_KEY in AI Studio under Settings > Secrets, then retry image generation.',
      });
      return;
    }

    const ai = createGenAIClient();

    const tasks = Array.from({ length: count }, (_, idx) =>
      generateSingleImage(ai, {
        prompt,
        style,
        aspectRatio,
        quality,
        variationIndex: idx,
        totalCount: count,
      })
    );

    const settled = await Promise.allSettled(tasks);
    const images: Array<{ dataUrl: string; model: string }> = [];
    let firstError: unknown = null;

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        images.push(result.value);
      } else if (!firstError) {
        firstError = result.reason;
      }
    }

    if (images.length === 0) {
      const classified = classifyGeminiError(firstError);
      res.status(classified.status).json({
        code: classified.code,
        error: classified.error,
        instructions: classified.instructions,
      });
      return;
    }

    const failedCount = count - images.length;
    res.json({
      images,
      warning:
        failedCount > 0
          ? `Generated ${images.length} of ${count} requested images. ${failedCount} variation${failedCount > 1 ? 's' : ''} did not complete.`
          : undefined,
    });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PIXEL AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PIXEL AI server:', err);
  process.exit(1);
});
