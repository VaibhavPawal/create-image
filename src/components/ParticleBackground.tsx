import { useEffect, useRef } from 'react';
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

export function ParticleBackground({ theme }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const palette =
      theme === 'dark'
        ? ['#8B5CF6', '#3B82F6', '#06B6D4', '#A78BFA']
        : ['#7C3AED', '#2563EB', '#0891B2', '#6366F1'];

    const particleCount = Math.min(48, Math.max(22, Math.floor((width * height) / 34000)));
    const particles: Particle[] = Array.from({ length: particleCount }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      radius: Math.random() * 1.6 + 0.7,
      color: palette[idx % palette.length],
      alpha: theme === 'dark' ? Math.random() * 0.38 + 0.16 : Math.random() * 0.22 + 0.08,
    }));

    let animationId = 0;

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
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
          const dist = Math.hypot(dx, dy);
          if (dist < 135) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha =
              (1 - dist / 135) * (theme === 'dark' ? 0.09 : 0.055);
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(drawFrame);
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (prefersReducedMotion) {
        drawFrame();
      }
    };

    drawFrame();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) window.cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Ambient futuristic radial glows */}
      <div className="animate-ambient-drift absolute -top-44 left-1/4 h-[34rem] w-[34rem] rounded-full bg-violet-600/14 blur-[120px] dark:bg-violet-600/20" />
      <div
        className="animate-ambient-drift absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-[120px] dark:bg-cyan-500/16"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="animate-ambient-drift absolute -bottom-48 left-12 h-[28rem] w-[28rem] rounded-full bg-blue-600/10 blur-[120px] dark:bg-blue-600/16"
        style={{ animationDelay: '-11s' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
