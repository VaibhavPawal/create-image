import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Compass, Wand2 } from 'lucide-react';
import { HERO_SHOWCASE_ITEMS } from '../data/catalog';
import type { StylePreset } from '../types';
import { SafeImage } from './SafeImage';
import { TiltCard } from './TiltCard';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreGallery: () => void;
  onUsePrompt: (prompt: string, style: StylePreset) => void;
}

export function HeroSection({
  onGetStarted,
  onExploreGallery,
  onUsePrompt,
}: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = HERO_SHOWCASE_ITEMS[activeIndex];
  const secondary = HERO_SHOWCASE_ITEMS[(activeIndex + 1) % HERO_SHOWCASE_ITEMS.length];

  return (
    <section className="relative pt-10 pb-14 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-22">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Typographic Proposition & CTAs */}
          <div className="lg:col-span-6">
            <p className="mb-4 text-sm font-medium tracking-wide text-violet-600 dark:text-cyan-400">
              PIXEL AI · Create Beyond Imagination
            </p>

            <h1 className="font-display text-[clamp(2.35rem,4.5vw,3.75rem)] leading-[1.06] font-bold tracking-tight text-balance text-slate-950 dark:text-white">
              Turn Your Imagination Into{' '}
              <span className="text-gradient-futuristic">Reality</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Create stunning AI-generated artwork with just a simple text prompt.
              Direct lighting, style, aspect ratio, and resolution in a responsive
              3D studio built for visual precision.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onGetStarted}
                className="gradient-cta inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#05070D]"
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                <span>Get Started</span>
                <ArrowDown className="h-4 w-4 opacity-80" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onExploreGallery}
                className="glass-panel inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-violet-400/60 hover:text-violet-700 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-100 dark:hover:border-cyan-400/50 dark:hover:text-cyan-300"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Explore Gallery</span>
              </button>
            </div>

            {/* Quiet unboxed capability summary */}
            <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200/80 pt-6 text-xs text-slate-500 sm:text-sm dark:border-slate-800/80 dark:text-slate-400">
              <span>9 Curated Styles</span>
              <span aria-hidden="true">·</span>
              <span>5 Aspect Ratios</span>
              <span aria-hidden="true">·</span>
              <span>Up to 2K Resolution</span>
              <span aria-hidden="true">·</span>
              <span>Batch Render 1–4x</span>
            </div>
          </div>

          {/* Right Column: Interactive 3D-Tilting Glass Artwork Showcase */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-2xl">
              {/* Subtle layered secondary floating glass plane behind primary */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-4 -right-3 hidden h-32 w-44 overflow-hidden rounded-2xl border border-violet-400/25 bg-[#0B1020]/70 opacity-75 shadow-2xl backdrop-blur-md sm:block"
                style={{ transform: 'rotate(4deg)' }}
              >
                <SafeImage
                  src={secondary.imageUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              </div>

              <TiltCard maxTilt={8} className="rounded-3xl">
                <div className="glass-panel-glow overflow-hidden rounded-3xl p-3 sm:p-4">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900">
                    <SafeImage
                      src={current.imageUrl}
                      alt={current.title}
                      fallbackTitle={current.title}
                      loading="eager"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-cyan-300">
                          Sample Showcase · {current.style} · {current.aspectRatio}
                        </p>
                        <h2 className="mt-0.5 truncate font-display text-lg font-semibold text-white">
                          {current.title}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUsePrompt(current.prompt, current.style)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/25 bg-black/55 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:border-cyan-400/70 hover:bg-violet-600/80 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        <span>Use Prompt</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive 3D Showcase Switcher */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Move cursor to inspect 3D depth
                    </span>
                    <div
                      role="tablist"
                      aria-label="Featured showcase artwork"
                      className="flex items-center gap-1.5"
                    >
                      {HERO_SHOWCASE_ITEMS.map((item, idx) => {
                        const selected = idx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setActiveIndex(idx)}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                              selected
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                            }`}
                          >
                            0{idx + 1}. {item.style === 'Realistic Photography' ? 'Architecture' : item.style}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
