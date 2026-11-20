import { memo, useEffect, useRef } from 'react';
import type { ThemeMode } from '../types';

interface ParticleBackgroundProps {
  theme: ThemeMode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

const FRAME_INTERVAL_MS = 1000 / 30; // 30fps cap for ultra-low CPU usage
const MAX_LINK_DIST_SQ = 120 * 120;

export const ParticleBackground = memo(function ParticleBackground({
  theme,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const palette =
      theme === 'dark'
        ? ['#8B5CF6', '#3B82F6', '#06B6D4']
        : ['#7C3AED', '#2563EB', '#0891B2'];

    const particleCount = Math.min(20, Math.max(10, Math.floor((width * height) / 90000)));
    const particles: Particle[] = Array.from({ length: particleCount }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.4 + 0.8,
      color: palette[idx % palette.length],
      alpha: theme === 'dark' ? Math.random() * 0.32 + 0.14 : Math.random() * 0.18 + 0.08,
    }));

    let animationId = 0;
    let lastFrameTime = 0;
    let resizeTimer = 0;
    let isPaused = document.hidden;

    const drawFrame = (timestamp: number) => {
      if (isPaused) return;

      if (!prefersReducedMotion && timestamp - lastFrameTime < FRAME_INTERVAL_MS) {
        animationId = window.requestAnimationFrame(drawFrame);
        return;
      }
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -8) p.x = width + 8;
          else if (p.x > width + 8) p.x = -8;
          if (p.y < -8) p.y = height + 8;
          else if (p.y > height + 8) p.y = -8;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < MAX_LINK_DIST_SQ) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha =
              (1 - distSq / MAX_LINK_DIST_SQ) * (theme === 'dark' ? 0.08 : 0.045);
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(drawFrame);
      }
    };

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused && !prefersReducedMotion) {
        lastFrameTime = 0;
        animationId = window.requestAnimationFrame(drawFrame);
      } else if (animationId) {
        window.cancelAnimationFrame(animationId);
        animationId = 0;
      }
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        if (prefersReducedMotion) {
          drawFrame(performance.now());
        }
      }, 150);
    };

    if (!isPaused) {
      animationId = window.requestAnimationFrame(drawFrame);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearTimeout(resizeTimer);
      if (animationId) window.cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <div
      aria-hidden="true"
      className="ambient-futuristic-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
});
