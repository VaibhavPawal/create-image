import { memo, useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}

const REST_TRANSFORM =
  'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

export const TiltCard = memo(function TiltCard({
  children,
  className = '',
  maxTilt = 6,
  glare = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const node = cardRef.current;
    if (!node) return;

    const clientX = event.clientX;
    const clientY = event.clientY;

    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;

      node.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;

      if (glare && glareRef.current) {
        glareRef.current.style.opacity = '1';
        glareRef.current.style.background = `radial-gradient(360px circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(139, 92, 246, 0.14), rgba(6, 182, 212, 0.05) 42%, transparent 72%)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (cardRef.current) {
      cardRef.current.style.transform = REST_TRANSFORM;
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: REST_TRANSFORM,
        transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative ${className}`}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200"
        />
      )}
    </div>
  );
});
