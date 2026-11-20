import { useState } from 'react';
import { EXPLORE_CATEGORIES, EXPLORE_SAMPLES } from '../data/catalog';
import type { ExploreCategory, PreviewableArtwork } from '../types';
import { ImageCard } from './ImageCard';

interface ExploreSectionProps {
  onPreview: (item: PreviewableArtwork) => void;
  onDownload: (item: PreviewableArtwork) => void;
  onCopyPrompt: (prompt: string) => void;
  onUsePrompt: (item: PreviewableArtwork) => void;
}

export function ExploreSection({
  onPreview,
  onDownload,
  onCopyPrompt,
  onUsePrompt,
}: ExploreSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExploreCategory>('All');

  const filteredItems =
    selectedCategory === 'All'
      ? EXPLORE_SAMPLES
      : EXPLORE_SAMPLES.filter((item) => item.category === selectedCategory);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400">
              Curated Sample Showcase · Distinct from Your Creations
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Explore AI Artwork
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
              Browse studio-curated sample works across eight visual categories. Select any artwork to inspect its prompt or load it directly into the generator.
            </p>
          </div>
          <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            Showing {filteredItems.length} of {EXPLORE_SAMPLES.length} sample works
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Explore categories"
          className="mb-8 flex flex-wrap items-center gap-2"
        >
          {(['All', ...EXPLORE_CATEGORIES] as Array<'All' | ExploreCategory>).map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  active
                    ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                    : 'border-slate-200/90 bg-white/75 text-slate-700 hover:border-violet-400/60 hover:text-slate-950 dark:border-slate-800 dark:bg-[#0B1020]/80 dark:text-slate-300 dark:hover:border-cyan-400/50 dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Responsive Gallery Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <ImageCard
              key={item.id}
              item={item}
              uniformAspect
              onPreview={onPreview}
              onDownload={onDownload}
              onCopyPrompt={onCopyPrompt}
              onUsePrompt={onUsePrompt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
