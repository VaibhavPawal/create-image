import { memo } from 'react';
import {
  ArrowUpRight,
  Copy,
  Download,
  Maximize2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getAspectRatioCssClass } from '../data/catalog';
import type { PreviewableArtwork } from '../types';
import { SafeImage } from './SafeImage';
import { TiltCard } from './TiltCard';

interface ImageCardProps {
  item: PreviewableArtwork;
  onPreview: (item: PreviewableArtwork) => void;
  onDownload: (item: PreviewableArtwork) => void;
  onCopyPrompt: (prompt: string) => void;
  onRegenerate?: (item: PreviewableArtwork) => void;
  onUsePrompt?: (item: PreviewableArtwork) => void;
  onDelete?: (id: string) => void;
  uniformAspect?: boolean;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const ImageCard = memo(function ImageCard({
  item,
  onPreview,
  onDownload,
  onCopyPrompt,
  onRegenerate,
  onUsePrompt,
  onDelete,
  uniformAspect = false,
}: ImageCardProps) {
  const isSample = item.source === 'sample';
  const aspectClass = uniformAspect ? 'aspect-[4/3]' : getAspectRatioCssClass(item.aspectRatio);
  const formattedDate = !isSample ? DATE_FORMATTER.format(new Date(item.createdAt)) : null;

  return (
    <TiltCard maxTilt={5} className="gallery-card-opt h-full rounded-2xl">
      <article className="glass-panel-glow group flex h-full flex-col overflow-hidden rounded-2xl">
        {/* Image Container */}
        <div
          className={`relative w-full overflow-hidden bg-slate-200/70 dark:bg-[#0B1020] ${aspectClass}`}
        >
          <button
            type="button"
            onClick={() => onPreview(item)}
            aria-label={`Preview ${isSample ? item.title : item.prompt}`}
            className="block h-full w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
          >
            <SafeImage
              src={item.imageUrl}
              alt={isSample ? item.title : item.prompt}
              fallbackTitle={isSample ? item.title : item.style}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          </button>

          {/* Subtle Hover Quick Preview Trigger */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => onPreview(item)}
              aria-label="Full-screen preview"
              title="Full-screen preview"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-black/60 text-white backdrop-blur-md transition-colors hover:border-cyan-400/70 hover:bg-violet-600/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Clean Unboxed Metadata & Actions */}
        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {isSample ? (
                <>
                  <span className="font-medium text-cyan-700 dark:text-cyan-400">
                    Sample Showcase
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.style}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-violet-700 dark:text-violet-300">
                    Your Creation
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.style}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{item.aspectRatio}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.quality === 'high' ? 'High Quality' : 'Standard'}</span>
                </>
              )}
            </div>

            {isSample && (
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h3>
            )}

            <p className="line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {item.prompt}
            </p>

            {formattedDate && (
              <p className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                {formattedDate}
              </p>
            )}
          </div>

          {/* Functional Action Bar */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPreview(item)}
                title="Full-screen preview"
                aria-label="Full-screen preview"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition-colors hover:border-violet-400/60 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:text-slate-300 dark:hover:border-violet-500/60 dark:hover:bg-violet-500/15 dark:hover:text-white"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onDownload(item)}
                title="Download image"
                aria-label="Download image"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition-colors hover:border-cyan-400/60 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 dark:border-slate-800 dark:text-slate-300 dark:hover:border-cyan-500/60 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-300"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onCopyPrompt(item.prompt)}
                title="Copy prompt"
                aria-label="Copy prompt"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition-colors hover:border-blue-400/60 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-slate-800 dark:text-slate-300 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
              </button>

              {!isSample && onRegenerate && (
                <button
                  type="button"
                  onClick={() => onRegenerate(item)}
                  title="Regenerate variation"
                  aria-label="Regenerate variation"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 transition-colors hover:border-violet-400/60 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:text-slate-300 dark:hover:border-violet-500/60 dark:hover:bg-violet-500/15 dark:hover:text-violet-300"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {isSample && onUsePrompt ? (
              <button
                type="button"
                onClick={() => onUsePrompt(item)}
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-violet-600 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:bg-white/10 dark:hover:bg-violet-600"
              >
                <span>Use Prompt</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  title="Delete creation"
                  aria-label="Delete creation"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 transition-colors hover:border-rose-400/60 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-800 dark:text-slate-400 dark:hover:border-rose-500/60 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )
            )}
          </div>
        </div>
      </article>
    </TiltCard>
  );
});
