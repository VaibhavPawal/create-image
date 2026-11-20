import { useEffect } from 'react';
import {
  ArrowUpRight,
  Copy,
  Download,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type { PreviewableArtwork } from '../types';
import { SafeImage } from './SafeImage';

interface LightboxModalProps {
  item: PreviewableArtwork | null;
  onClose: () => void;
  onDownload: (item: PreviewableArtwork) => void;
  onCopyPrompt: (prompt: string) => void;
  onRegenerate: (item: PreviewableArtwork) => void;
  onUsePrompt: (item: PreviewableArtwork) => void;
  onDelete: (id: string) => void;
}

export function LightboxModal({
  item,
  onClose,
  onDownload,
  onCopyPrompt,
  onRegenerate,
  onUsePrompt,
  onDelete,
}: LightboxModalProps) {
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const isSample = item.source === 'sample';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen image preview"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/82 backdrop-blur-md"
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-[#080C18] text-slate-100 shadow-2xl lg:flex-row">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full-screen preview"
          className="absolute top-3.5 right-3.5 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/65 text-white backdrop-blur-md transition-colors hover:border-cyan-400 hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Image Stage */}
        <div className="flex flex-1 items-center justify-center bg-[#04060C] p-4 sm:p-6">
          <SafeImage
            src={item.imageUrl}
            alt={isSample ? item.title : item.prompt}
            fallbackTitle={isSample ? item.title : item.style}
            loading="eager"
            className="max-h-[56vh] w-auto max-w-full rounded-2xl object-contain lg:max-h-[82vh]"
          />
        </div>

        {/* Side Details & Actions */}
        <div className="flex w-full shrink-0 flex-col justify-between gap-6 border-t border-slate-800 bg-[#0B1020] p-6 lg:w-80 lg:border-t-0 lg:border-l">
          <div className="space-y-4 overflow-y-auto">
            <div className="text-xs text-slate-400">
              {isSample ? (
                <span>
                  <strong className="font-semibold text-cyan-400">Sample Showcase</strong> ·{' '}
                  {item.category}
                </span>
              ) : (
                <span>
                  <strong className="font-semibold text-violet-300">Your Creation</strong> ·{' '}
                  {item.quality === 'high' ? 'High Quality (2K)' : 'Standard'}
                </span>
              )}
            </div>

            {isSample && (
              <h2 className="font-display text-xl font-bold text-white">
                {item.title}
              </h2>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-400">Prompt</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                {item.prompt}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-xs">
              <div>
                <span className="block text-slate-500">Style</span>
                <span className="mt-0.5 block font-medium text-slate-200">
                  {item.style}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Aspect Ratio</span>
                <span className="mt-0.5 block font-mono font-medium tabular-nums text-slate-200">
                  {item.aspectRatio}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => onDownload(item)}
              className="gradient-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Artwork</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onCopyPrompt(item.prompt)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Prompt</span>
              </button>

              {isSample ? (
                <button
                  type="button"
                  onClick={() => {
                    onUsePrompt(item);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/50 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/30"
                >
                  <span>Use Prompt</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onRegenerate(item);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/50 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/30"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>

            {!isSample && (
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id);
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-950/35 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/65"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete Creation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
