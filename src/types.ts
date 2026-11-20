export type StylePreset =
  | 'Realistic Photography'
  | '3D Render'
  | 'Anime'
  | 'Cyberpunk'
  | 'Digital Art'
  | 'Cartoon'
  | 'Fantasy'
  | 'Cinematic'
  | 'Watercolor';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type QualityTier = 'standard' | 'high';

export type ImageCount = 1 | 2 | 4;

export type ExploreCategory =
  | 'Nature'
  | 'Architecture'
  | 'Cars'
  | 'Fantasy'
  | 'Portraits'
  | 'Space'
  | 'Animals'
  | 'Technology';

export type NavSection = 'home' | 'explore' | 'creations';

export type ThemeMode = 'dark' | 'light';

export interface GenerationParams {
  prompt: string;
  style: StylePreset;
  aspectRatio: AspectRatio;
  quality: QualityTier;
  count: ImageCount;
}

export interface CreationItem {
  id: string;
  imageUrl: string;
  prompt: string;
  style: StylePreset;
  aspectRatio: AspectRatio;
  quality: QualityTier;
  model: string;
  createdAt: number;
  source: 'generated';
}

export interface ExploreItem {
  id: string;
  title: string;
  category: ExploreCategory;
  style: StylePreset;
  aspectRatio: AspectRatio;
  prompt: string;
  imageUrl: string;
  source: 'sample';
}

export type PreviewableArtwork = CreationItem | ExploreItem;

export interface UserProfile {
  displayName: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export interface ApiErrorInfo {
  code: string;
  error: string;
  instructions?: string;
}
