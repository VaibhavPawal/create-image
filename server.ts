import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const REQUEST_TIMEOUT_MS = 55_000;

// Cloudflare Workers AI models (covered by 10,000 free Neurons/day, resets 00:00 UTC)
const SQUARE_FLUX_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const ASPECT_SDXL_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
};

const VALID_QUALITIES = new Set(['standard', 'high']);
const VALID_COUNTS = new Set([1, 2, 4]);

const STYLE_DIRECTIVES: Record<string, string> = {
  'Realistic Photography':
    'photorealistic photography, natural optical focus, authentic lighting, rich real-world detail',
  '3D Render':
    'high-detail 3D sculptural render, physically based materials, global illumination, crisp reflections',
  Anime:
    'Japanese anime feature-film artwork, expressive cel-shaded lighting, crisp linework, atmospheric background',
  Cyberpunk:
    'futuristic cyberpunk atmosphere, rain-slicked reflections, architectural neon accents, cinematic depth',
  'Digital Art':
    'contemporary digital illustration, refined brushwork, rich atmospheric color harmony',
  Cartoon:
    'stylized modern cartoon illustration, clean bold silhouettes, expressive shapes, vibrant cohesive palette',
  Fantasy:
    'epic high-fantasy concept illustration, dramatic lighting, majestic scale, intricate environmental detail',
  Cinematic:
    'cinematic film still, dramatic rim lighting, shallow depth of field, curated color grading',
  Watercolor:
    'fine art watercolor painting on textured cold-pressed paper, delicate translucent pigment washes, organic brushwork',
};

const VARIATION_ANGLES = [
  'balanced primary composition',
  'alternative camera angle and dramatic lighting',
  'wider environmental framing with clear focal subject',
  'closer detailed perspective emphasizing rich textures',
];

const DEFAULT_NEGATIVE_PROMPT =
  'blurry, distorted, low resolution, watermark, text overlay, deformed, artifacts';

interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  missingVars: string[];
  configured: boolean;
}

function getCloudflareConfig(): CloudflareConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() ?? '';
  const missingVars: string[] = [];

  if (!accountId || accountId === 'MY_CLOUDFLARE_ACCOUNT_ID' || accountId.length < 8) {
    missingVars.push('CLOUDFLARE_ACCOUNT_ID');
  }
  if (!apiToken || apiToken === 'MY_CLOUDFLARE_API_TOKEN' || apiToken.length < 10) {
    missingVars.push('CLOUDFLARE_API_TOKEN');
  }

  return {
    accountId,
    apiToken,
    missingVars,
    configured: missingVars.length === 0,
  };
}

interface ParsedProviderError {
  status: number;
  code: string;
  error: string;
  instructions: string;
  model: string;
  details?: string;
}

class UpstreamProviderError extends Error {
  httpStatus: number;
  cfCode?: number;

  constructor(message: string, httpStatus: number, cfCode?: number) {
    super(message);
    this.name = 'UpstreamProviderError';
    this.httpStatus = httpStatus;
    this.cfCode = cfCode;
  }
}

function sanitizeErrorText(text: string): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  let cleaned = text;
  if (apiToken && apiToken.length >= 8) {
    cleaned = cleaned.split(apiToken).join('[REDACTED_TOKEN]');
  }
  if (accountId && accountId.length >= 8) {
    cleaned = cleaned.split(accountId).join('[REDACTED_ACCOUNT]');
  }

  return cleaned
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
}

function detectImageMimeFromBase64(b64: string): string {
  if (b64.startsWith('iVBOR')) return 'image/png';
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('UklGR')) return 'image/webp';
  return 'image/png';
}

function classifyProviderError(err: unknown, model: string): ParsedProviderError {
  const httpStatus = err instanceof UpstreamProviderError ? err.httpStatus : undefined;
  const cfCode = err instanceof UpstreamProviderError ? err.cfCode : undefined;
  const rawMessage =
    err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
  const message = sanitizeErrorText(rawMessage);
  const lower = message.toLowerCase();

  if (
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    (err instanceof Error && err.name === 'AbortError')
  ) {
    return {
      status: 504,
      code: 'TIMEOUT',
      model,
      error: 'The image generation request timed out before Cloudflare Workers AI finished.',
      instructions: 'Try generating 1 image or switching to Standard quality, then retry.',
    };
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    cfCode === 10000 ||
    cfCode === 9109 ||
    lower.includes('authentication') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid token') ||
    lower.includes('invalid account')
  ) {
    return {
      status: 403,
      code: 'AUTH_INVALID',
      model,
      error: 'Cloudflare Workers AI rejected your credentials or permissions.',
      instructions:
        'Verify CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Settings > Secrets. Make sure the API token has the "Workers AI: Read" / "Workers AI: Edit" permission for your account.',
      details: message || undefined,
    };
  }

  if (
    httpStatus === 429 ||
    cfCode === 3036 ||
    lower.includes('neuron') ||
    lower.includes('daily free allocation') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return {
      status: 429,
      code: 'DAILY_QUOTA_EXCEEDED',
      model,
      error: 'Cloudflare Workers AI free daily limit (10,000 Neurons/day) or rate limit reached.',
      instructions:
        'Your free daily allowance resets automatically at 00:00 UTC. If this is a temporary burst rate limit, wait a few seconds and retry with 1 image.',
      details: message || undefined,
    };
  }

  if (
    httpStatus === 400 &&
    (lower.includes('nsfw') || lower.includes('safety') || lower.includes('flagged') || lower.includes('blocked'))
  ) {
    return {
      status: 400,
      code: 'CONTENT_FILTERED',
      model,
      error: 'Your prompt was blocked by content safety filters.',
      instructions: 'Rephrase the prompt description and try generating again.',
      details: message || undefined,
    };
  }

  if (httpStatus === 404 || lower.includes('no route') || lower.includes('not found')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      model,
      error: `Cloudflare Workers AI could not locate the endpoint or model "${model}".`,
      instructions:
        'Double-check that CLOUDFLARE_ACCOUNT_ID in Settings > Secrets matches your Cloudflare Account ID (32-character hex ID).',
      details: message || undefined,
    };
  }

  return {
    status: 502,
    code: 'GENERATION_FAILED',
    model,
    error: 'Image generation failed due to an upstream Cloudflare Workers AI error.',
    instructions:
      'Check your CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Settings > Secrets, then retry.',
    details: message || undefined,
  };
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof UpstreamProviderError) {
    return err.httpStatus >= 500 && err.httpStatus !== 501;
  }
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed') ||
    msg.includes('socket')
  );
}

function selectModelForRequest(aspectRatio: string): string {
  // FLUX.1-schnell on Cloudflare produces ultra-sharp 1:1 square renders in 4-8 steps.
  // SDXL Base 1.0 supports explicit custom width/height for 16:9, 9:16, 4:3, and 3:4 ratios.
  return aspectRatio === '1:1' ? SQUARE_FLUX_MODEL : ASPECT_SDXL_MODEL;
}

async function callCloudflareModel(
  config: CloudflareConfig,
  params: {
    prompt: string;
    style: string;
    aspectRatio: string;
    quality: 'standard' | 'high';
    variationIndex: number;
    totalCount: number;
  },
  parentSignal: AbortSignal
): Promise<{ dataUrl: string; model: string }> {
  const model = selectModelForRequest(params.aspectRatio);
  const styleGuide = STYLE_DIRECTIVES[params.style] ?? STYLE_DIRECTIVES['Digital Art'];
  const variationHint =
    params.totalCount > 1
      ? `, ${VARIATION_ANGLES[params.variationIndex % VARIATION_ANGLES.length]}`
      : '';

  const exactUserPrompt = params.prompt.trim();
  const fullPrompt = `${exactUserPrompt}, ${params.style} style, ${styleGuide}${variationHint}`;

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/ai/run/${model}`;

  let requestBody: Record<string, unknown>;
  if (model === SQUARE_FLUX_MODEL) {
    requestBody = {
      prompt: fullPrompt.slice(0, 2048),
      steps: params.quality === 'high' ? 8 : 4,
    };
  } else {
    const dims = ASPECT_DIMENSIONS[params.aspectRatio] ?? ASPECT_DIMENSIONS['1:1'];
    requestBody = {
      prompt: fullPrompt.slice(0, 2048),
      negative_prompt: DEFAULT_NEGATIVE_PROMPT,
      width: dims.width,
      height: dims.height,
      num_steps: params.quality === 'high' ? 20 : 14,
      guidance: 7.5,
      seed: Math.floor(Math.random() * 2_000_000_000) + params.variationIndex,
    };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const onParentAbort = () => controller.abort();

    if (parentSignal.aborted) {
      clearTimeout(timeoutId);
      throw new Error('Request aborted by client.');
    }
    parentSignal.addEventListener('abort', onParentAbort, { once: true });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (!response.ok) {
        let errMessage = `Cloudflare Workers AI returned HTTP ${response.status}.`;
        let cfCode: number | undefined;
        if (contentType.includes('application/json')) {
          const errJson = (await response.json().catch(() => null)) as {
            errors?: Array<{ code?: number; message?: string }>;
          } | null;
          const firstErr = errJson?.errors?.[0];
          if (firstErr?.message) errMessage = firstErr.message;
          if (typeof firstErr?.code === 'number') cfCode = firstErr.code;
        } else {
          const textBody = await response.text().catch(() => '');
          if (textBody.trim()) errMessage = textBody.trim().slice(0, 300);
        }
        throw new UpstreamProviderError(errMessage, response.status, cfCode);
      }

      if (contentType.includes('application/json')) {
        const json = (await response.json()) as {
          success?: boolean;
          result?: { image?: string };
          errors?: Array<{ code?: number; message?: string }>;
        };

        if (json.success === false) {
          const firstErr = json.errors?.[0];
          throw new UpstreamProviderError(
            firstErr?.message || 'Cloudflare Workers AI reported generation failure.',
            502,
            firstErr?.code
          );
        }

        const b64 = json.result?.image;
        if (!b64 || typeof b64 !== 'string') {
          throw new UpstreamProviderError(
            'No image data was returned by Cloudflare Workers AI.',
            502
          );
        }

        const cleanB64 = b64.includes(',') ? b64.split(',').pop() ?? b64 : b64;
        const mime = detectImageMimeFromBase64(cleanB64);
        return {
          dataUrl: `data:${mime};base64,${cleanB64}`,
          model,
        };
      }

      // Binary image response (e.g. SDXL returns raw PNG/JPEG bytes)
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength === 0) {
        throw new UpstreamProviderError('Empty image response returned by Cloudflare Workers AI.', 502);
      }
      const b64 = Buffer.from(arrayBuf).toString('base64');
      const mime =
        contentType.startsWith('image/')
          ? contentType.split(';')[0].trim()
          : detectImageMimeFromBase64(b64);

      return {
        dataUrl: `data:${mime};base64,${b64}`,
        model,
      };
    } catch (err) {
      lastError = err;
      if (parentSignal.aborted) {
        throw err;
      }
      if (attempt === 0 && isRetryableError(err)) {
        await new Promise((resolve) => setTimeout(resolve, 650));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      parentSignal.removeEventListener('abort', onParentAbort);
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const cf = getCloudflareConfig();
    res.json({
      status: 'ok',
      provider: 'cloudflare-workers-ai',
      apiConfigured: cf.configured,
      missingEnvVars: cf.missingVars,
      models: {
        square: SQUARE_FLUX_MODEL,
        aspectRatio: ASPECT_SDXL_MODEL,
      },
    });
  });

  app.post('/api/generate', async (req: Request, res: Response) => {
    const requestAbort = new AbortController();
    let clientDisconnected = false;

    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
        requestAbort.abort();
      }
    });

    try {
      const body = req.body ?? {};
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      const style =
        typeof body.style === 'string' && body.style in STYLE_DIRECTIVES
          ? body.style
          : 'Digital Art';
      const aspectRatio =
        typeof body.aspectRatio === 'string' && body.aspectRatio in ASPECT_DIMENSIONS
          ? body.aspectRatio
          : '1:1';
      const quality: 'standard' | 'high' =
        typeof body.quality === 'string' && VALID_QUALITIES.has(body.quality)
          ? (body.quality as 'standard' | 'high')
          : 'standard';
      const count =
        typeof body.count === 'number' && VALID_COUNTS.has(body.count) ? body.count : 1;
      const requestedModel = selectModelForRequest(aspectRatio);

      if (!prompt) {
        res.status(400).json({
          code: 'INVALID_PROMPT',
          error: 'Please enter a prompt describing the image you want to create.',
          instructions: 'Write a clear visual description and click Generate Image.',
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

      const cf = getCloudflareConfig();
      if (!cf.configured) {
        res.status(503).json({
          code: 'PROVIDER_NOT_CONFIGURED',
          model: requestedModel,
          error: `Cloudflare Workers AI is not configured yet (missing ${cf.missingVars.join(' and ')}).`,
          instructions:
            'Create a free Cloudflare account (10,000 free Neurons/day, no credit card required), generate a Workers AI API token, and add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Settings > Secrets.',
        });
        return;
      }

      const tasks = Array.from({ length: count }, (_, idx) =>
        callCloudflareModel(
          cf,
          {
            prompt,
            style,
            aspectRatio,
            quality,
            variationIndex: idx,
            totalCount: count,
          },
          requestAbort.signal
        )
      );

      const settled = await Promise.allSettled(tasks);

      if (clientDisconnected || res.writableEnded) {
        return;
      }

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
        const classified = classifyProviderError(firstError, requestedModel);
        console.error(
          `[PIXEL AI] Cloudflare Workers AI failed (${classified.code}, model=${classified.model}):`,
          classified.details ?? classified.error
        );
        res.status(classified.status).json({
          code: classified.code,
          model: classified.model,
          error: classified.error,
          instructions: classified.instructions,
          details: classified.details,
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
    } catch (unexpectedErr) {
      if (clientDisconnected || res.writableEnded) {
        return;
      }
      const classified = classifyProviderError(unexpectedErr, SQUARE_FLUX_MODEL);
      console.error(
        '[PIXEL AI] Unexpected /api/generate error:',
        classified.details ?? classified.error
      );
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        model: classified.model,
        error: 'An unexpected server error occurred while processing your request.',
        instructions: 'Please try again in a moment.',
      });
    }
  });

  // Catch malformed JSON or Express middleware errors cleanly without crashing
  app.use(
    (err: unknown, _req: Request, res: Response, next: (e?: unknown) => void) => {
      if (res.headersSent) {
        next(err);
        return;
      }
      const isSyntaxErr =
        err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400;
      res.status(isSyntaxErr ? 400 : 500).json({
        code: isSyntaxErr ? 'INVALID_REQUEST' : 'INTERNAL_ERROR',
        error: isSyntaxErr
          ? 'Invalid JSON payload sent to the image generation API.'
          : 'An unexpected server error occurred.',
        instructions: 'Refresh the page and try again.',
      });
    }
  );

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        maxAge: '1h',
        etag: true,
      })
    );
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
