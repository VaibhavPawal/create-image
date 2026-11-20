import { useMemo, useState } from 'react';
import { FolderOpen, Search, Trash2, Wand2 } from 'lucide-react';
import { STYLE_PRESETS } from '../data/catalog';
import type { CreationItem, PreviewableArtwork, StylePreset } from '../types';
import { estimateCreationsSizeMB } from '../utils/storage';
import { ImageCard } from './ImageCard';

interface MyCreationsSectionProps {
  creations: CreationItem[];
  isLoading: boolean;
  onPreview: (item: PreviewableArtwork) => void;
  onDownload: (item: PreviewableArtwork) => void;
  onCopyPrompt: (prompt: string) => void;
  onRegenerate: (item: PreviewableArtwork) => void;
  onDelete: (id: string) => void;
  onRequestClearAll: () => void;
  onGoToStudio: () => void;
}

export function MyCreationsSection({
  creations,
  isLoading,
  onPreview,
  onDownload,
  onCopyPrompt,
  onRegenerate,
  onDelete,
  onRequestClearAll,
  onGoToStudio,
}: MyCreationsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState<'All' | StylePreset>('All');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return creations.filter((item) => {
      if (styleFilter !== 'All' && item.style !== styleFilter) return false;
      if (q && !item.prompt.toLowerCase().includes(q) && !item.style.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [creations, searchQuery, styleFilter]);

  const storageSize = useMemo(() => estimateCreationsSizeMB(creations), [creations]);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
              Stored Locally in Browser IndexedDB
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              My Creations
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Every image you generate is saved persistently in your browser library for instant preview, download, and regeneration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {creations.length} {creations.length === 1 ? 'creation' : 'creations'} · {storageSize}
            </span>
            {creations.length > 0 && (
              <button
                type="button"
                onClick={onRequestClearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/80 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-500/35 dark:bg-rose-950/35 dark:text-rose-300 dark:hover:bg-rose-950/60"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {creations.length > 0 && (
          <div className="glass-panel mb-8 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your creations by prompt or style..."
                aria-label="Search creations"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white/90 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-[#070B16] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
              />
            </div>

            <div className="sm:w-56">
              <label htmlFor="creations-style-filter" className="sr-only">
                Filter by artistic style
              </label>
              <select
                id="creations-style-filter"
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value as 'All' | StylePreset)}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-[#070B16] dark:text-slate-100 dark:focus:border-cyan-400"
              >
                <option value="All">All Styles</option>
                {STYLE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-3">
                <div className="skeleton-shimmer relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-900" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
              </div>
            ))}
          </div>
        ) : creations.length === 0 ? (
          /* Empty State */
          <div className="glass-panel-glow flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-600 dark:bg-violet-500/20 dark:text-cyan-300">
              <FolderOpen className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-slate-950 dark:text-white">
              No saved creations yet
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Generated artwork appears here automatically and persists across sessions in your browser. Head to the studio to create your first piece.
            </p>
            <button
              type="button"
              onClick={onGoToStudio}
              className="gradient-cta mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
            >
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              <span>Create Your First Image</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Filtered Empty State */
          <div className="glass-panel rounded-3xl px-6 py-14 text-center">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              No creations match your filter
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Try clearing your search query or selecting a different artistic style.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStyleFilter('All');
              }}
              className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:border-violet-500 dark:border-slate-700 dark:text-slate-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                uniformAspect
                onPreview={onPreview}
                onDownload={onDownload}
                onCopyPrompt={onCopyPrompt}
                onRegenerate={onRegenerate}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
