import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ExploreSection } from './components/ExploreSection';
import { GeneratorWorkspace } from './components/GeneratorWorkspace';
import { HeroSection } from './components/HeroSection';
import { LightboxModal } from './components/LightboxModal';
import { MyCreationsSection } from './components/MyCreationsSection';
import { Navbar } from './components/Navbar';
import { ParticleBackground } from './components/ParticleBackground';
import { ProfileDrawer } from './components/ProfileDrawer';
import { ToastContainer } from './components/ToastContainer';
import { RANDOM_PROMPTS } from './data/catalog';
import type {
  ApiErrorInfo,
  CreationItem,
  GenerationParams,
  NavSection,
  PreviewableArtwork,
  StylePreset,
  ThemeMode,
  ToastMessage,
  UserProfile,
} from './types';
import {
  clearAllCreationsFromDB,
  copyTextToClipboard,
  deleteCreationFromDB,
  downloadArtworkImage,
  loadCreationsFromDB,
  loadThemeMode,
  loadUserProfile,
  saveCreationsToDB,
  saveThemeMode,
  saveUserProfile,
} from './utils/storage';

const INITIAL_PARAMS: GenerationParams = {
  prompt: '',
  style: '3D Render',
  aspectRatio: '1:1',
  quality: 'standard',
  count: 1,
};

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [theme, setTheme] = useState<ThemeMode>(() => loadThemeMode());
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [params, setParams] = useState<GenerationParams>(INITIAL_PARAMS);

  const [creations, setCreations] = useState<CreationItem[]>([]);
  const [recentResults, setRecentResults] = useState<CreationItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [apiError, setApiError] = useState<ApiErrorInfo | null>(null);

  const [previewItem, setPreviewItem] = useState<PreviewableArtwork | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const randomIndexRef = useRef(0);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const pushToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = createId();
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Sync dark/light theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemeMode(theme);
  }, [theme]);

  // Persist user profile changes
  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  // Load persisted IndexedDB creations
  useEffect(() => {
    let cancelled = false;

    loadCreationsFromDB()
      .then((items) => {
        if (!cancelled) {
          setCreations(items);
          setIsLoadingHistory(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToWorkspace = useCallback(() => {
    if (activeSection !== 'home') {
      setActiveSection('home');
      window.setTimeout(() => {
        workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        textareaRef.current?.focus();
      }, 120);
    } else {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      textareaRef.current?.focus();
    }
  }, [activeSection]);

  const handleNavigate = useCallback((section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleChangeParams = useCallback((next: Partial<GenerationParams>) => {
    setParams((prev) => ({ ...prev, ...next }));
  }, []);

  const handleClearPrompt = useCallback(() => {
    setParams((prev) => ({ ...prev, prompt: '' }));
    textareaRef.current?.focus();
    pushToast('info', 'Prompt cleared');
  }, [pushToast]);

  const handleCopyPrompt = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const ok = await copyTextToClipboard(text);
      if (ok) {
        pushToast('success', 'Prompt copied', 'Ready to paste anywhere.');
      } else {
        pushToast('error', 'Clipboard unavailable', 'Please copy the prompt manually.');
      }
    },
    [pushToast]
  );

  const handleRandomPrompt = useCallback(() => {
    const pick = RANDOM_PROMPTS[randomIndexRef.current % RANDOM_PROMPTS.length];
    randomIndexRef.current += 1;
    setParams((prev) => ({
      ...prev,
      prompt: pick.prompt,
      style: pick.style,
    }));
    setApiError(null);
    pushToast('info', 'Random prompt loaded', `Style set to ${pick.style}.`);
  }, [pushToast]);

  const runGeneration = useCallback(
    async (targetParams: GenerationParams) => {
      const trimmedPrompt = targetParams.prompt.trim();
      if (!trimmedPrompt) {
        pushToast('error', 'Enter a prompt first', 'Describe the image you want to create.');
        textareaRef.current?.focus();
        return;
      }

      setApiError(null);
      setIsGenerating(true);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmedPrompt,
            style: targetParams.style,
            aspectRatio: targetParams.aspectRatio,
            quality: targetParams.quality,
            count: targetParams.count,
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload || !Array.isArray(payload.images)) {
          const errInfo: ApiErrorInfo = {
            code: payload?.code || 'REQUEST_FAILED',
            error:
              payload?.error ||
              'Unable to generate image right now. Please try again.',
            instructions: payload?.instructions,
          };
          setApiError(errInfo);
          pushToast('error', 'Generation failed', errInfo.error);
          return;
        }

        const now = Date.now();
        const generatedItems: CreationItem[] = payload.images.map(
          (img: { dataUrl: string; model: string }, index: number) => ({
            id: createId(),
            imageUrl: img.dataUrl,
            prompt: trimmedPrompt,
            style: targetParams.style,
            aspectRatio: targetParams.aspectRatio,
            quality: targetParams.quality,
            model: img.model,
            createdAt: now + index,
            source: 'generated',
          })
        );

        setRecentResults(generatedItems);
        setCreations((prev) => [...generatedItems, ...prev]);

        await saveCreationsToDB(generatedItems);

        if (payload.warning) {
          pushToast('info', 'Batch completed with warning', payload.warning);
        } else {
          pushToast(
            'success',
            generatedItems.length === 1
              ? 'Artwork generated'
              : `${generatedItems.length} artworks generated`,
            'Saved automatically to My Creations.'
          );
        }
      } catch {
        const networkError: ApiErrorInfo = {
          code: 'NETWORK_ERROR',
          error: 'Could not reach the PIXEL AI generation server.',
          instructions: 'Verify the server is running and try again.',
        };
        setApiError(networkError);
        pushToast('error', 'Connection error', networkError.error);
      } finally {
        setIsGenerating(false);
      }
    },
    [pushToast]
  );

  const handleGenerate = useCallback(() => {
    void runGeneration(params);
  }, [params, runGeneration]);

  const handleUsePromptFromSample = useCallback(
    (prompt: string, style: StylePreset) => {
      setParams((prev) => ({ ...prev, prompt, style }));
      setApiError(null);
      scrollToWorkspace();
      pushToast('info', 'Prompt loaded in studio', `Style set to ${style}.`);
    },
    [pushToast, scrollToWorkspace]
  );

  const handleUseSampleItem = useCallback(
    (item: PreviewableArtwork) => {
      handleUsePromptFromSample(item.prompt, item.style);
    },
    [handleUsePromptFromSample]
  );

  const handleRegenerate = useCallback(
    (item: PreviewableArtwork) => {
      const nextParams: GenerationParams = {
        prompt: item.prompt,
        style: item.style,
        aspectRatio: item.aspectRatio,
        quality: item.source === 'generated' ? item.quality : params.quality,
        count: 1,
      };
      setParams(nextParams);
      scrollToWorkspace();
      void runGeneration(nextParams);
    },
    [params.quality, runGeneration, scrollToWorkspace]
  );

  const handleDownload = useCallback(
    (item: PreviewableArtwork) => {
      downloadArtworkImage(
        item.imageUrl,
        item.source === 'sample' ? item.title : item.prompt
      );
      pushToast('success', 'Download started');
    },
    [pushToast]
  );

  const handleDeleteCreation = useCallback(
    async (id: string) => {
      setCreations((prev) => prev.filter((item) => item.id !== id));
      setRecentResults((prev) => prev.filter((item) => item.id !== id));
      await deleteCreationFromDB(id);
      pushToast('info', 'Creation removed');
    },
    [pushToast]
  );

  const handleConfirmClearAll = useCallback(async () => {
    setIsConfirmClearOpen(false);
    setCreations([]);
    setRecentResults([]);
    await clearAllCreationsFromDB();
    pushToast('info', 'All creations cleared', 'Your local browser library is now empty.');
  }, [pushToast]);

  const handleUpdateDisplayName = useCallback(
    (displayName: string) => {
      setProfile({ displayName });
      pushToast('success', 'Profile updated');
    },
    [pushToast]
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      <ParticleBackground theme={theme} />

      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        profile={profile}
        creationsCount={creations.length}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeSection === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroSection
                onGetStarted={scrollToWorkspace}
                onExploreGallery={() => handleNavigate('explore')}
                onUsePrompt={handleUsePromptFromSample}
              />

              <GeneratorWorkspace
                workspaceRef={workspaceRef}
                textareaRef={textareaRef}
                params={params}
                onChangeParams={handleChangeParams}
                onGenerate={handleGenerate}
                onClearPrompt={handleClearPrompt}
                onCopyPrompt={handleCopyPrompt}
                onRandomPrompt={handleRandomPrompt}
                isGenerating={isGenerating}
                apiError={apiError}
                onDismissError={() => setApiError(null)}
                recentResults={recentResults}
                onPreview={setPreviewItem}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
                onDelete={handleDeleteCreation}
              />
            </motion.div>
          )}

          {activeSection === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ExploreSection
                onPreview={setPreviewItem}
                onDownload={handleDownload}
                onCopyPrompt={handleCopyPrompt}
                onUsePrompt={handleUseSampleItem}
              />
            </motion.div>
          )}

          {activeSection === 'creations' && (
            <motion.div
              key="creations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <MyCreationsSection
                creations={creations}
                isLoading={isLoadingHistory}
                onPreview={setPreviewItem}
                onDownload={handleDownload}
                onCopyPrompt={handleCopyPrompt}
                onRegenerate={handleRegenerate}
                onDelete={handleDeleteCreation}
                onRequestClearAll={() => setIsConfirmClearOpen(true)}
                onGoToStudio={scrollToWorkspace}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200/80 py-8 dark:border-slate-800/80">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-slate-900 dark:text-white">
              PIXEL AI
            </span>
            <span aria-hidden="true">·</span>
            <span>Create Beyond Imagination</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('explore')}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('creations')}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              My Creations
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals, Drawers & Toasts */}
      <LightboxModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDownload={handleDownload}
        onCopyPrompt={handleCopyPrompt}
        onRegenerate={handleRegenerate}
        onUsePrompt={handleUseSampleItem}
        onDelete={handleDeleteCreation}
      />

      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        creations={creations}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onUpdateDisplayName={handleUpdateDisplayName}
        onNavigate={handleNavigate}
      />

      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="Clear all saved creations?"
        description="This permanently removes all generated images from your browser's local library. Downloaded files on your device will not be affected."
        confirmLabel="Clear All Creations"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsConfirmClearOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
