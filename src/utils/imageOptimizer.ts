/**
 * Compresses large base64 PNG data URLs into high-clarity WebP/JPEG images
 * sized cleanly for crisp display and fast IndexedDB persistence without UI lag.
 */
export async function optimizeGeneratedDataUrl(
  dataUrl: string,
  maxDimension: number
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.decoding = 'async';

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        if (!naturalW || !naturalH) {
          resolve(dataUrl);
          return;
        }

        const scale = Math.min(1, maxDimension / Math.max(naturalW, naturalH));
        const targetW = Math.max(1, Math.round(naturalW * scale));
        const targetH = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Prefer WebP for best quality-to-size ratio; fall back to JPEG if unsupported
        const webpUrl = canvas.toDataURL('image/webp', 0.9);
        if (webpUrl.startsWith('data:image/webp') && webpUrl.length < dataUrl.length) {
          resolve(webpUrl);
          return;
        }

        const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(jpegUrl.length < dataUrl.length ? jpegUrl : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
