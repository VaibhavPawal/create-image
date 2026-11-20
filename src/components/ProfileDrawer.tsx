import { memo, useEffect, useMemo, useState } from 'react';
import { FolderHeart, Moon, Sun, X } from 'lucide-react';
import type { CreationItem, NavSection, ThemeMode, UserProfile } from '../types';
import { estimateCreationsSizeMB } from '../utils/storage';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  creations: CreationItem[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onUpdateDisplayName: (name: string) => void;
  onNavigate: (section: NavSection) => void;
}

export const ProfileDrawer = memo(function ProfileDrawer({
  isOpen,
  onClose,
  profile,
  creations,
  theme,
  onToggleTheme,
  onUpdateDisplayName,
  onNavigate,
}: ProfileDrawerProps) {
  const [nameInput, setNameInput] = useState(profile.displayName);

  useEffect(() => {
    setNameInput(profile.displayName);
  }, [profile.displayName, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const storageSize = useMemo(() => estimateCreationsSizeMB(creations), [creations]);

  if (!isOpen) return null;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateDisplayName(trimmed);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Studio Profile"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-sm"
        aria-hidden="true"
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col justify-between border-l border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-[#080C18]/96">
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                Studio Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Free local studio · No account required
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile drawer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-violet-400 hover:text-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="studio-display-name"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Creator Display Name
            </label>
            <div className="flex gap-2">
              <input
                id="studio-display-name"
                type="text"
                maxLength={40}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                }}
                className="h-10 flex-1 rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-[#05070D] dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                Save
              </button>
            </div>
          </div>

          {/* Local Library Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200/90 p-4 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saved Creations
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
                {creations.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 p-4 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browser Storage
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
                {storageSize}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 border-t border-slate-200/80 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200/90 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-violet-400/60 dark:border-slate-800 dark:text-slate-200"
            >
              <span className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-violet-600" aria-hidden="true" />
                )}
                <span>Interface Theme</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {theme === 'dark' ? 'Dark Futuristic' : 'Light Studio'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('creations');
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200/90 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-violet-400/60 dark:border-slate-800 dark:text-slate-200"
            >
              <span className="flex items-center gap-2.5">
                <FolderHeart className="h-4 w-4 text-violet-500" aria-hidden="true" />
                <span>Open My Creations</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {creations.length}
              </span>
            </button>
          </div>
        </div>

        <p className="border-t border-slate-200/80 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          All creations and preferences stay private inside your browser on this device.
        </p>
      </aside>
    </div>
  );
});

export default ProfileDrawer;
