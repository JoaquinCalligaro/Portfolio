// Stars background (light mode)
import { cn } from '@/lib/utils';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type RefObject,
  type FC,
} from 'react';

interface StarProps {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number | null;
  color: string;
}

interface StarBackgroundProps {
  starDensity?: number;
  allStarsTwinkle?: boolean;
  twinkleProbability?: number;
  minTwinkleSpeed?: number;
  maxTwinkleSpeed?: number;
  className?: string;
  intensity?: number;
}

export const StarsBackgroundLight: FC<StarBackgroundProps> = ({
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
  className,
  intensity = 1,
}) => {
  const [stars, setStars] = useState<StarProps[]>([]);
  const canvasRef: RefObject<HTMLCanvasElement> =
    useRef<HTMLCanvasElement>(null);

  // Paleta de colores para modo claro
  const starColors = [
    '99, 102, 241', // Índigo
    '59, 130, 246', // Azul
    '16, 185, 129', // Esmeralda
    '245, 158, 11', // Ámbar
    '239, 68, 68', // Rojo
    '139, 92, 246', // Violeta
  ];

  const generateStars = useCallback(
    (width: number, height: number): StarProps[] => {
      const area = width * height;
      const numStars = Math.floor(area * starDensity);
      return Array.from({ length: numStars }, () => {
        const shouldTwinkle =
          allStarsTwinkle || Math.random() < twinkleProbability;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: (Math.random() * 0.9 + 0.5) * intensity,
          opacity: Math.min(
            1,
            (Math.random() * 0.3 + 0.5) * (0.85 + intensity * 0.15)
          ),
          twinkleSpeed: shouldTwinkle
            ? minTwinkleSpeed +
              Math.random() * (maxTwinkleSpeed - minTwinkleSpeed)
            : null,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        };
      });
    },
    [
      starDensity,
      allStarsTwinkle,
      twinkleProbability,
      minTwinkleSpeed,
      maxTwinkleSpeed,
    ]
  );

  useEffect(() => {
    const updateStars = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use full document dimensions to cover entire scrollable content
        const width = Math.max(
          document.documentElement.scrollWidth,
          window.innerWidth
        );
        const height = Math.max(
          document.documentElement.scrollHeight,
          window.innerHeight
        );

        canvas.width = width;
        canvas.height = height;
        setStars(generateStars(width, height));
      }
    };

    updateStars();
    window.addEventListener('resize', updateStars);

    return () => window.removeEventListener('resize', updateStars);
  }, [generateStars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        // Crear gradiente radial para efecto de brillo suave
        const gradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          star.radius * 2
        );
        gradient.addColorStop(0, `rgba(${star.color}, ${star.opacity})`);
        gradient.addColorStop(1, `rgba(${star.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fill();

        // Efecto de parpadeo
        if (star.twinkleSpeed !== null) {
          star.opacity =
            0.2 +
            Math.abs(Math.sin((Date.now() * 0.001) / star.twinkleSpeed) * 0.4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 w-full',
        className?.replace(/bg-\S+/g, '').trim()
      )}
    />
  );
};
