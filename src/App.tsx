import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Loader2 } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { GeneratorWorkspace } from './components/GeneratorWorkspace';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { ParticleBackground } from './components/ParticleBackground';
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
import { optimizeGeneratedDataUrl } from './utils/imageOptimizer';
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

// Lazy-load secondary views and modals so initial page load stays fast
const ExploreSection = lazy(() => import('./components/ExploreSection'));
const MyCreationsSection = lazy(() => import('./components/MyCreationsSection'));
const LightboxModal = lazy(() => import('./components/LightboxModal'));
const ProfileDrawer = lazy(() => import('./components/ProfileDrawer'));

const INITIAL_PARAMS: GenerationParams = {
  prompt: '',
  style: '3D Render',
  aspectRatio: '1:1',
  quality: 'standard',
  count: 1,
};

const CLIENT_TIMEOUT_MS = 65_000;

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ViewLoadingFallback() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center px-4">
      <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-[#0B1020]/85 dark:text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin text-violet-500 dark:text-cyan-400" aria-hidden="true" />
        <span>Loading view...</span>
      </div>
    </div>
  );
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
  const [generationStatus, setGenerationStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [apiError, setApiError] = useState<ApiErrorInfo | null>(null);

  const [previewItem, setPreviewItem] = useState<PreviewableArtwork | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const randomIndexRef = useRef(0);
  const isGeneratingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const elapsedTimerRef = useRef<number>(0);
  const scrollTimerRef = useRef<number>(0);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const workspaceRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const dismissToast = useCallback((id: string) => {
    const existingTimer = toastTimersRef.current.get(id);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = createId();
      setToasts((prev) => [...prev.slice(-2), { id, type, title, description }]);
      const timerId = window.setTimeout(() => {
        toastTimersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4000);
      toastTimersRef.current.set(id, timerId);
    },
    []
  );

  // Clean up all timers and abort any in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      window.clearInterval(elapsedTimerRef.current);
      window.clearTimeout(scrollTimerRef.current);
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      toastTimersRef.current.clear();
    };
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

  // Load persisted IndexedDB creations once on startup
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
    window.clearTimeout(scrollTimerRef.current);
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      textareaRef.current?.focus();
      return;
    }
    setActiveSection('home');
    scrollTimerRef.current = window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      textareaRef.current?.focus();
    }, 80);
  }, []);

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

  const stopGenerationTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = 0;
    }
  }, []);

  const handleCancelGeneration = useCallback(() => {
    if (!abortControllerRef.current) return;
    requestIdRef.current += 1;
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    isGeneratingRef.current = false;
    stopGenerationTimer();
    setIsGenerating(false);
    setGenerationStatus('');
    pushToast('info', 'Generation cancelled');
  }, [pushToast, stopGenerationTimer]);

  const runGeneration = useCallback(
    async (targetParams: GenerationParams, allowPreempt = false) => {
      const trimmedPrompt = targetParams.prompt.trim();
      if (!trimmedPrompt) {
        pushToast('error', 'Enter a prompt first', 'Describe the image you want to create.');
        textareaRef.current?.focus();
        return;
      }

      // Prevent duplicate concurrent requests unless explicitly regenerating
      if (isGeneratingRef.current) {
        if (!allowPreempt) return;
        abortControllerRef.current?.abort();
      }

      const activeRequestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isGeneratingRef.current = true;

      setApiError(null);
      setIsGenerating(true);
      setElapsedSeconds(0);
      setGenerationStatus('Sending exact prompt to Cloudflare Workers AI...');

      stopGenerationTimer();
      const startedAt = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - startedAt) / 1000);
        setElapsedSeconds(secs);
        if (secs >= 2) {
          setGenerationStatus(
            targetParams.aspectRatio === '1:1'
              ? 'Rendering artwork with FLUX.1-schnell...'
              : 'Rendering artwork with SDXL...'
          );
        }
      }, 1000);

      let timedOut = false;
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: trimmedPrompt,
            style: targetParams.style,
            aspectRatio: targetParams.aspectRatio,
            quality: targetParams.quality,
            count: targetParams.count,
          }),
        });

        window.clearTimeout(timeoutId);

        if (activeRequestId !== requestIdRef.current) {
          return;
        }

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload || !Array.isArray(payload.images)) {
          const errInfo: ApiErrorInfo = {
            code: payload?.code || 'REQUEST_FAILED',
            error:
              payload?.error ||
              'Unable to generate image right now. Please try again.',
            instructions: payload?.instructions,
            model: typeof payload?.model === 'string' ? payload.model : undefined,
            details: typeof payload?.details === 'string' ? payload.details : undefined,
          };
          setApiError(errInfo);
          pushToast('error', 'Generation failed', errInfo.error);
          return;
        }

        setGenerationStatus('Optimizing images...');
        const maxDim = targetParams.quality === 'high' ? 2048 : 1440;
        const optimizedUrls = await Promise.all(
          payload.images.map((img: { dataUrl: string }) =>
            optimizeGeneratedDataUrl(img.dataUrl, maxDim)
          )
        );

        if (activeRequestId !== requestIdRef.current) {
          return;
        }

        const now = Date.now();
        const generatedItems: CreationItem[] = payload.images.map(
          (img: { dataUrl: string; model: string }, index: number) => ({
            id: createId(),
            imageUrl: optimizedUrls[index] || img.dataUrl,
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
      } catch (err) {
        window.clearTimeout(timeoutId);
        if (activeRequestId !== requestIdRef.current) {
          return;
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          if (timedOut) {
            const timeoutError: ApiErrorInfo = {
              code: 'TIMEOUT',
              error: 'Image generation timed out after 65 seconds.',
              instructions:
                'Try generating 1 image at Standard quality or retry in a moment.',
            };
            setApiError(timeoutError);
            pushToast('error', 'Request timed out', timeoutError.error);
          }
          return;
        }

        const networkError: ApiErrorInfo = {
          code: 'NETWORK_ERROR',
          error: 'Could not reach the PIXEL AI generation server.',
          instructions: 'Check your network connection and try again.',
        };
        setApiError(networkError);
        pushToast('error', 'Connection error', networkError.error);
      } finally {
        if (activeRequestId === requestIdRef.current) {
          abortControllerRef.current = null;
          isGeneratingRef.current = false;
          stopGenerationTimer();
          setIsGenerating(false);
          setGenerationStatus('');
        }
      }
    },
    [pushToast, stopGenerationTimer]
  );

  const handleGenerate = useCallback(() => {
    void runGeneration(params, false);
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
      void runGeneration(nextParams, true);
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

  const handleOpenProfile = useCallback(() => setIsProfileOpen(true), []);
  const handleCloseProfile = useCallback(() => setIsProfileOpen(false), []);
  const handleClosePreview = useCallback(() => setPreviewItem(null), []);
  const handleDismissError = useCallback(() => setApiError(null), []);
  const handleRequestClearAll = useCallback(() => setIsConfirmClearOpen(true), []);
  const handleCancelClearAll = useCallback(() => setIsConfirmClearOpen(false), []);
  const handleExploreNav = useCallback(() => handleNavigate('explore'), [handleNavigate]);

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
        onOpenProfile={handleOpenProfile}
      />

      <main className="flex-1">
        {activeSection === 'home' && (
          <div>
            <HeroSection
              onGetStarted={scrollToWorkspace}
              onExploreGallery={handleExploreNav}
              onUsePrompt={handleUsePromptFromSample}
            />

            <GeneratorWorkspace
              workspaceRef={workspaceRef}
              textareaRef={textareaRef}
              params={params}
              onChangeParams={handleChangeParams}
              onGenerate={handleGenerate}
              onCancelGeneration={handleCancelGeneration}
              onClearPrompt={handleClearPrompt}
              onCopyPrompt={handleCopyPrompt}
              onRandomPrompt={handleRandomPrompt}
              isGenerating={isGenerating}
              generationStatus={generationStatus}
              elapsedSeconds={elapsedSeconds}
              apiError={apiError}
              onDismissError={handleDismissError}
              recentResults={recentResults}
              onPreview={setPreviewItem}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
              onDelete={handleDeleteCreation}
            />
          </div>
        )}

        {activeSection === 'explore' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <ExploreSection
              onPreview={setPreviewItem}
              onDownload={handleDownload}
              onCopyPrompt={handleCopyPrompt}
              onUsePrompt={handleUseSampleItem}
            />
          </Suspense>
        )}

        {activeSection === 'creations' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <MyCreationsSection
              creations={creations}
              isLoading={isLoadingHistory}
              onPreview={setPreviewItem}
              onDownload={handleDownload}
              onCopyPrompt={handleCopyPrompt}
              onRegenerate={handleRegenerate}
              onDelete={handleDeleteCreation}
              onRequestClearAll={handleRequestClearAll}
              onGoToStudio={scrollToWorkspace}
            />
          </Suspense>
        )}
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

      {/* Lazy-Loaded Modals & Drawers */}
      {previewItem && (
        <Suspense fallback={null}>
          <LightboxModal
            item={previewItem}
            onClose={handleClosePreview}
            onDownload={handleDownload}
            onCopyPrompt={handleCopyPrompt}
            onRegenerate={handleRegenerate}
            onUsePrompt={handleUseSampleItem}
            onDelete={handleDeleteCreation}
          />
        </Suspense>
      )}

      {isProfileOpen && (
        <Suspense fallback={null}>
          <ProfileDrawer
            isOpen={isProfileOpen}
            onClose={handleCloseProfile}
            profile={profile}
            creations={creations}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onUpdateDisplayName={handleUpdateDisplayName}
            onNavigate={handleNavigate}
          />
        </Suspense>
      )}

      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="Clear all saved creations?"
        description="This permanently removes all generated images from your browser's local library. Downloaded files on your device will not be affected."
        confirmLabel="Clear All Creations"
        onConfirm={handleConfirmClearAll}
        onCancel={handleCancelClearAll}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
