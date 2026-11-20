import { memo, useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const SafeImage = memo(function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  loading = 'lazy',
  fetchPriority = 'auto',
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setLoaded(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-200 via-indigo-100 to-cyan-100 p-4 text-center text-slate-600 dark:from-[#0B1020] dark:via-[#121933] dark:to-[#0A1929] dark:text-slate-300 ${className}`}
      >
        <ImageOff className="h-6 w-6 opacity-60" aria-hidden="true" />
        <span className="max-w-[18ch] truncate text-xs font-medium">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setHasError(true)}
      className={`${className} transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
});
