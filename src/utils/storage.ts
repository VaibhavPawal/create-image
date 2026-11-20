import type { CreationItem, ThemeMode, UserProfile } from '../types';

const DB_NAME = 'pixel_ai_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'creations';

const PROFILE_STORAGE_KEY = 'pixel_ai_profile_v1';
const THEME_STORAGE_KEY = 'pixel_ai_theme';

export const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Alex Mercer',
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function loadCreationsFromDB(): Promise<CreationItem[]> {
  try {
    const db = await openDatabase();
    return await new Promise<CreationItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as CreationItem[]) ?? [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error ?? new Error('Failed to load creations'));
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function saveCreationsToDB(items: CreationItem[]): Promise<boolean> {
  if (items.length === 0) return true;
  try {
    const db = await openDatabase();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Failed to save creations'));
      };
    });
  } catch {
    return false;
  }
}

export async function deleteCreationFromDB(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Failed to delete creation'));
      };
    });
  } catch {
    return false;
  }
}

export async function clearAllCreationsFromDB(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Failed to clear creations'));
      };
    });
  } catch {
    return false;
  }
}

export function estimateCreationsSizeMB(items: CreationItem[]): string {
  const bytes = items.reduce((sum, item) => sum + item.imageUrl.length * 0.75 + item.prompt.length, 0);
  const mb = bytes / (1024 * 1024);
  if (mb < 0.01 && items.length > 0) return '< 0.01 MB';
  return `${mb.toFixed(2)} MB`;
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      displayName:
        typeof parsed.displayName === 'string' && parsed.displayName.trim()
          ? parsed.displayName.trim()
          : DEFAULT_PROFILE.displayName,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota issues for profile settings
  }
}

export function loadThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveThemeMode(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota issues
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function downloadArtworkImage(imageUrl: string, label: string): void {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 44);
  const ext = imageUrl.startsWith('data:image/jpeg') || imageUrl.endsWith('.jpg') ? 'jpg' : 'png';
  const filename = `pixel-ai-${slug || 'artwork'}-${Date.now().toString().slice(-4)}.${ext}`;

  const anchor = document.createElement('a');
  anchor.href = imageUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
