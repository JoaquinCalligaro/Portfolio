// Configuración de tecnologías para el stack tecnológico
// Edita este archivo para añadir/quitar tecnologías. Los iconos están en /src/assets/svg
// Solo especifica el nombre del archivo SVG, no la ruta completa

// Estructura de cada tecnología individual
export interface TechItem {
  name: string;
  hex: string;
  hexAlpha: string;
  icon: string;
  color?: string;
  loading?: 'lazy' | 'eager';
}

// Grupo de tecnologías por categoría
export interface TechStackGroup {
  categoryKey: 'frontend' | 'database' | 'tools' | 'designTools';
  items: TechItem[];
}

// Lista de todas las tecnologías organizadas por categoría
export const stacks: TechStackGroup[] = [
  {
    categoryKey: 'frontend',
    items: [
      {
        name: 'HTML5',
        hex: '#E34F26',
        hexAlpha: '#E34F2633',
        icon: 'html.svg',
        color: 'text-orange-500',
        loading: 'eager',
      },
      {
        name: 'CSS3',
        hex: '#1572B6',
        hexAlpha: '#1572B633',
        icon: 'css.svg',
        color: 'text-blue-600',
        loading: 'eager',
      },
      {
        name: 'Sass',
        hex: '#CC6699',
        hexAlpha: '#CC669933',
        icon: 'sass.svg',
        color: 'text-pink-500',
        loading: 'eager',
      },
      {
        name: 'Tailwind CSS',
        hex: '#06B6D4',
        hexAlpha: '#06B6D433',
        icon: 'tailwindcss.svg',
        color: 'text-teal-500',
        loading: 'eager',
      },
      {
        name: 'JavaScript',
        hex: '#F7DF1E',
        hexAlpha: '#F7DF1E33',
        icon: 'javascript.svg',
        color: 'text-yellow-500',
        loading: 'eager',
      },
      {
        name: 'TypeScript',
        hex: '#3178C6',
        hexAlpha: '#3178C633',
        icon: 'typescript.svg',
        color: 'text-blue-600',
      },
      {
        name: 'React',
        hex: '#61DAFB',
        hexAlpha: '#61DAFB33',
        icon: 'react.svg',
        color: 'text-cyan-400',
        loading: 'eager',
      },
      {
        name: 'Astro',
        hex: '#FF5E00',
        hexAlpha: '#FF5E0033',
        icon: 'astro-logo.svg',
        color: 'text-orange-500',
        loading: 'eager',
      },
    ],
  },
  {
    categoryKey: 'database',
    items: [
      {
        name: 'SQL',
        hex: '#4479A1',
        hexAlpha: '#4479A133',
        icon: 'mysql.svg',
        color: 'text-gray-900 dark:text-white',
        loading: 'eager',
      },
    ],
  },
  {
    categoryKey: 'tools',
    items: [
      {
        name: 'Git',
        hex: '#F1502F',
        hexAlpha: '#F1502F33',
        icon: 'github.svg',
        color: 'text-red-600',
        loading: 'lazy',
      },
      {
        name: 'VSCode',
        hex: '#007ACC',
        hexAlpha: '#007ACC33',
        icon: 'vscode.svg',
        color: 'text-blue-500',
        loading: 'lazy',
      },
      {
        name: 'Postman',
        hex: '#FF6C37',
        hexAlpha: '#FF6C3733',
        icon: 'postman.svg',
        color: 'text-orange-500',
        loading: 'lazy',
      },
    ],
  },
  {
    categoryKey: 'designTools',
    items: [
      {
        name: 'Figma',
        hex: '#F24E1E',
        hexAlpha: '#F24E1E33',
        icon: 'figma.svg',
        color: 'text-pink-500',
        loading: 'lazy',
      },
      {
        name: 'Adobe Photoshop',
        hex: '#31A8FF',
        hexAlpha: '#31A8FF33',
        icon: 'photohop.svg',
        color: 'text-blue-700',
        loading: 'lazy',
      },
      {
        name: 'Canva',
        hex: '#00C4CC',
        hexAlpha: '#00C4CC33',
        icon: 'canva.svg',
        color: 'text-teal-600',
        loading: 'lazy',
      },
    ],
  },
];
