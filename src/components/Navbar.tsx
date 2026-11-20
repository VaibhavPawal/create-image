import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import type { NavSection, ThemeMode, UserProfile } from '../types';

interface NavbarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  profile: UserProfile;
  creationsCount: number;
  onOpenProfile: () => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'explore', label: 'Explore' },
  { id: 'creations', label: 'My Creations' },
];

export function Navbar({
  activeSection,
  onNavigate,
  theme,
  onToggleTheme,
  profile,
  creationsCount,
  onOpenProfile,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = profile.displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PX';

  const handleSelect = (section: NavSection) => {
    onNavigate(section);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/78 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#05070D]/80">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-400 shadow-md shadow-violet-500/25 transition-transform duration-200 group-hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
              <path
                d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 2.5V12M12 12L20.5 7.5M12 12L3.5 7.5M12 12V21.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            PIXEL AI
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded ${
                  isActive
                    ? 'text-slate-950 dark:text-white'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'creations' && creationsCount > 0 && (
                  <span className="ml-1.5 font-mono text-xs tabular-nums text-violet-600 dark:text-cyan-400">
                    ({creationsCount})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme toggle + Profile button */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 text-slate-700 transition-colors hover:border-violet-400/60 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:bg-[#0B1020]/90 dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-cyan-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Open studio profile"
            title="Studio Profile"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/85 text-sm font-medium text-slate-800 transition-colors hover:border-violet-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-800 dark:bg-[#0B1020]/90 dark:text-slate-100 dark:hover:border-violet-500/60 shrink-0"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 font-mono text-[11px] font-semibold text-white">
              {initials}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 text-slate-700 md:hidden dark:border-slate-800 dark:bg-[#0B1020]/90 dark:text-slate-200"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden dark:border-slate-800/80 dark:bg-[#080C18]/95"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === 'creations' && (
                    <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-cyan-400">
                      {creationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
