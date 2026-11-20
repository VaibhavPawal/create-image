import type { RefObject } from 'react';
import {
  AlertTriangle,
  Copy,
  Dices,
  Eraser,
  ImagePlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  ASPECT_RATIO_OPTIONS,
  getAspectRatioCssClass,
  STYLE_PRESETS,
} from '../data/catalog';
import type {
  ApiErrorInfo,
  AspectRatio,
  CreationItem,
  GenerationParams,
  ImageCount,
  PreviewableArtwork,
  QualityTier,
  StylePreset,
} from '../types';
import { ImageCard } from './ImageCard';

interface GeneratorWorkspaceProps {
  workspaceRef: RefObject<HTMLElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  params: GenerationParams;
  onChangeParams: (next: Partial<GenerationParams>) => void;
  onGenerate: () => void;
  onClearPrompt: () => void;
  onCopyPrompt: (text: string) => void;
  onRandomPrompt: () => void;
  isGenerating: boolean;
  apiError: ApiErrorInfo | null;
  onDismissError: () => void;
  recentResults: CreationItem[];
  onPreview: (item: PreviewableArtwork) => void;
  onDownload: (item: PreviewableArtwork) => void;
  onRegenerate: (item: PreviewableArtwork) => void;
  onDelete: (id: string) => void;
}

const COUNTS: ImageCount[] = [1, 2, 4];

export function GeneratorWorkspace({
  workspaceRef,
  textareaRef,
  params,
  onChangeParams,
  onGenerate,
  onClearPrompt,
  onCopyPrompt,
  onRandomPrompt,
  isGenerating,
  apiError,
  onDismissError,
  recentResults,
  onPreview,
  onDownload,
  onRegenerate,
  onDelete,
}: GeneratorWorkspaceProps) {
  const skeletonAspect = getAspectRatioCssClass(params.aspectRatio);

  return (
    <section
      ref={workspaceRef}
      id="studio-workspace"
      className="pb-20 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* Studio Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              AI Image Studio
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Compose your prompt, refine style and framing, and generate real artwork via Google Gemini image models.
            </p>
          </div>
        </div>

        {/* Main Glassmorphic Workspace Panel */}
        <div className="glass-panel-glow rounded-3xl p-5 sm:p-7">
          {/* Prompt Input Header + Quick Actions */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="pixel-prompt-input"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Prompt
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRandomPrompt}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-violet-400/60 hover:text-violet-700 disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-cyan-400/50 dark:hover:text-cyan-300"
              >
                <Dices className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Random Prompt</span>
              </button>

              <button
                type="button"
                onClick={() => onCopyPrompt(params.prompt)}
                disabled={!params.prompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-400/60 hover:text-blue-700 disabled:opacity-45 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-400/50 dark:hover:text-blue-300"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Prompt</span>
              </button>

              <button
                type="button"
                onClick={onClearPrompt}
                disabled={!params.prompt.trim() || isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-rose-400/60 hover:text-rose-600 disabled:opacity-45 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-rose-500/60 dark:hover:text-rose-400"
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear Prompt</span>
              </button>
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="pixel-prompt-input"
              rows={4}
              maxLength={1200}
              value={params.prompt}
              onChange={(e) => onChangeParams({ prompt: e.target.value })}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isGenerating) {
                  e.preventDefault();
                  onGenerate();
                }
              }}
              placeholder="Describe the image you want to create..."
              className="w-full resize-y rounded-2xl border border-slate-200/90 bg-white/90 p-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-700/80 dark:bg-[#070B16]/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400/80 dark:focus:ring-cyan-400/20"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Tip: Press Ctrl / Cmd + Enter to generate</span>
              <span className="font-mono tabular-nums">
                {params.prompt.length} / 1200
              </span>
            </div>
          </div>

          {/* Settings Controls Grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200/80 pt-6 md:grid-cols-2 lg:grid-cols-12 dark:border-slate-800/80">
            {/* Style Selection Dropdown */}
            <div className="lg:col-span-3">
              <label
                htmlFor="pixel-style-select"
                className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Artistic Style
              </label>
              <select
                id="pixel-style-select"
                value={params.style}
                disabled={isGenerating}
                onChange={(e) =>
                  onChangeParams({ style: e.target.value as StylePreset })
                }
                className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm font-medium text-slate-900 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 disabled:opacity-50 dark:border-slate-700/80 dark:bg-[#070B16] dark:text-slate-100 dark:focus:border-cyan-400"
              >
                {STYLE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.value}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {STYLE_PRESETS.find((s) => s.value === params.style)?.hint}
              </p>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="lg:col-span-4">
              <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Aspect Ratio
              </span>
              <div
                role="radiogroup"
                aria-label="Aspect Ratio"
                className="grid grid-cols-3 gap-1.5 sm:grid-cols-5"
              >
                {ASPECT_RATIO_OPTIONS.map((option) => {
                  const selected = params.aspectRatio === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isGenerating}
                      title={option.label}
                      onClick={() =>
                        onChangeParams({ aspectRatio: option.value as AspectRatio })
                      }
                      className={`flex h-11 flex-col items-center justify-center rounded-xl border px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 ${
                        selected
                          ? 'border-violet-500 bg-violet-600/12 text-violet-700 dark:border-cyan-400/80 dark:bg-violet-500/20 dark:text-white'
                          : 'border-slate-200/90 bg-white/60 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#070B16]/70 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-semibold tabular-nums">
                        {option.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Selected:{' '}
                {ASPECT_RATIO_OPTIONS.find((a) => a.value === params.aspectRatio)?.label}
              </p>
            </div>

            {/* Quality Selector */}
            <div className="lg:col-span-3">
              <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Image Quality
              </span>
              <div
                role="radiogroup"
                aria-label="Image Quality"
                className="grid grid-cols-2 gap-1.5"
              >
                {(
                  [
                    { id: 'standard', label: 'Standard' },
                    { id: 'high', label: 'High Quality' },
                  ] as Array<{ id: QualityTier; label: string }>
                ).map((q) => {
                  const selected = params.quality === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isGenerating}
                      onClick={() => onChangeParams({ quality: q.id })}
                      className={`flex h-11 items-center justify-center rounded-xl border px-3 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 ${
                        selected
                          ? 'border-violet-500 bg-violet-600/12 text-violet-700 dark:border-cyan-400/80 dark:bg-violet-500/20 dark:text-white'
                          : 'border-slate-200/90 bg-white/60 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#070B16]/70 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {params.quality === 'high'
                  ? '2K crisp high-resolution detail'
                  : 'Fast studio image render'}
              </p>
            </div>

            {/* Number of Images */}
            <div className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Images
              </span>
              <div
                role="radiogroup"
                aria-label="Number of images"
                className="grid grid-cols-3 gap-1.5"
              >
                {COUNTS.map((count) => {
                  const selected = params.count === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isGenerating}
                      onClick={() => onChangeParams({ count })}
                      className={`flex h-11 items-center justify-center rounded-xl border font-mono text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 ${
                        selected
                          ? 'border-violet-500 bg-violet-600/12 text-violet-700 dark:border-cyan-400/80 dark:bg-violet-500/20 dark:text-white'
                          : 'border-slate-200/90 bg-white/60 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-[#070B16]/70 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {params.count === 1 ? 'Single render' : `${params.count} variations`}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-6 flex flex-col items-stretch justify-between gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center dark:border-slate-800/80">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>
                Output saved automatically to{' '}
                <strong className="font-medium text-slate-700 dark:text-slate-200">
                  My Creations
                </strong>{' '}
                in your browser.
              </span>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !params.prompt.trim()}
              className="gradient-cta inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1020]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>
                    Generating {params.count > 1 ? `${params.count} Images` : 'Image'}...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>

          {/* Structured Error Display */}
          {apiError && (
            <div
              role="alert"
              className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-400/40 bg-rose-50/90 p-4 text-sm text-rose-950 sm:flex-row sm:items-start sm:justify-between dark:border-rose-500/35 dark:bg-rose-950/35 dark:text-rose-100"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold">{apiError.error}</p>
                  {apiError.instructions && (
                    <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-200/90">
                      {apiError.instructions}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onDismissError}
                className="self-start rounded-lg px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200/60 dark:text-rose-200 dark:hover:bg-rose-900/50 whitespace-nowrap shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Live Generation Results Section */}
        <div className="mt-10">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-white">
              Generated Results
            </h3>
            {recentResults.length > 0 && !isGenerating && (
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {recentResults.length} {recentResults.length === 1 ? 'image' : 'images'} in latest batch
              </span>
            )}
          </div>

          {isGenerating ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: params.count }).map((_, index) => (
                <div
                  key={index}
                  className="glass-panel overflow-hidden rounded-2xl p-3"
                >
                  <div
                    className={`skeleton-shimmer relative w-full overflow-hidden rounded-xl bg-slate-200/80 dark:bg-slate-900/90 ${skeletonAspect}`}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-500 dark:text-cyan-400" aria-hidden="true" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Rendering variation {index + 1} of {params.count}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 px-1">
                    <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentResults.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-6 ${
                recentResults.length === 1
                  ? 'max-w-xl'
                  : recentResults.length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {recentResults.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  onPreview={onPreview}
                  onDownload={onDownload}
                  onCopyPrompt={onCopyPrompt}
                  onRegenerate={onRegenerate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-600 dark:bg-violet-500/20 dark:text-cyan-300">
                <ImagePlus className="h-6 w-6" aria-hidden="true" />
              </div>
              <h4 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
                Your canvas is ready
              </h4>
              <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Enter a visual description above or try a random prompt to generate real artwork directly into this gallery.
              </p>
              <button
                type="button"
                onClick={onRandomPrompt}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-cyan-400/60 dark:hover:text-cyan-300"
              >
                <Dices className="h-4 w-4" aria-hidden="true" />
                <span>Load a Random Prompt</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
