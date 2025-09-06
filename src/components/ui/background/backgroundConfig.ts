// Configuración centralizada para backgrounds (dark / light)
// Edita este archivo para ajustar colores, velocidades y densidades.

export interface ShootingStarsConfig {
  starColor: string;
  trailColor: string;
  minSpeed: number;
  maxSpeed: number;
  minDelay: number;
  maxDelay: number;
  starWidth: number;
  starHeight: number;
}

export interface StarsCanvasConfig {
  starDensity: number;
  allStarsTwinkle: boolean;
  twinkleProbability: number;
  minTwinkleSpeed: number;
  maxTwinkleSpeed: number;
  // Para modo oscuro: un solo color base en formato 'r, g, b'. Para modo claro: array de colores.
  baseStarColor?: string; // ej: '255, 255, 255'
  starColors?: string[]; // solo light mode
  backgroundClass?: string; // clases tailwind para el canvas
  intensity?: number; // factor para radio/opacity (1 = base)
}

export interface BackgroundModeConfig {
  shooting: ShootingStarsConfig;
  stars: StarsCanvasConfig;
  zIndex: { background: string; shooting: string };
}

export interface BackgroundConfig {
  dark: BackgroundModeConfig;
  light: BackgroundModeConfig;
}

export const backgroundConfig: BackgroundConfig = {
  dark: {
    shooting: {
      starColor: '#9E00FF',
      trailColor: '#2EB9DF',
      minSpeed: 10,
      maxSpeed: 30,
      minDelay: 1200,
      maxDelay: 4200,
      starWidth: 10,
      starHeight: 1,
    },
    stars: {
      starDensity: 0.0002,
      allStarsTwinkle: true,
      twinkleProbability: 0.7,
      minTwinkleSpeed: 0.5,
      maxTwinkleSpeed: 1,
      baseStarColor: '255, 255, 255',
      backgroundClass: 'bg-cyan-950/50 text-cyan-500',
      intensity: 1.15,
    },
    zIndex: { background: '-z-30', shooting: '-z-20' },
  },
  light: {
    shooting: {
      starColor: '#4338CA',
      trailColor: '#0EA5E9',
      minSpeed: 10,
      maxSpeed: 30,
      minDelay: 1200,
      maxDelay: 4200,
      starWidth: 10,
      starHeight: 1,
    },
    stars: {
      starDensity: 0.0002,
      allStarsTwinkle: true,
      twinkleProbability: 0.7,
      minTwinkleSpeed: 0.5,
      maxTwinkleSpeed: 1,
      starColors: [
        '99, 102, 241', // Indigo
        '59, 130, 246', // Blue
        '16, 185, 129', // Emerald
        '245, 158, 11', // Amber
        '239, 68, 68', // Red
        '139, 92, 246', // Violet
      ],
      backgroundClass: 'bg-gray-300/50',
      intensity: 1.5,
    },
    zIndex: { background: '-z-30', shooting: '-z-20' },
  },
};

export default backgroundConfig;
