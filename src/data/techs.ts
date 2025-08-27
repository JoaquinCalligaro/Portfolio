// Lista de tecnologías por categoría.
// Edita este archivo para añadir/quitar tecnologías. Los iconos están en /public/svg
export interface TechItem {
  name: string;
  hex: string;
  hexAlpha: string;
  icon: string;
  color?: string;
  loading?: 'lazy' | 'eager';
}

export interface TechStackGroup {
  title: string;
  items: TechItem[];
}

export const stacks: TechStackGroup[] = [
  {
    title: 'Front-end',
    items: [
      {
        name: 'HTML5',
        hex: '#E34F26',
        hexAlpha: '#E34F2633',
        icon: '/src/assets/html.svg',
        color: 'text-orange-500',
        loading: 'eager',
      },
      {
        name: 'CSS3',
        hex: '#1572B6',
        hexAlpha: '#1572B633',
        icon: '/src/assets/CSS.svg',
        color: 'text-blue-600',
        loading: 'eager',
      },
      {
        name: 'Sass',
        hex: '#CC6699',
        hexAlpha: '#CC669933',
        icon: '/src/assets/SASS.svg',
        color: 'text-pink-500',
        loading: 'eager',
      },
      {
        name: 'Tailwind CSS',
        hex: '#06B6D4',
        hexAlpha: '#06B6D433',
        icon: '/src/assets/TailwindCSS.svg',
        color: 'text-teal-500',
        loading: 'eager',
      },
      {
        name: 'JavaScript',
        hex: '#F7DF1E',
        hexAlpha: '#F7DF1E33',
        icon: '/src/assets/Javascript.svg',
        color: 'text-yellow-500',
        loading: 'eager',
      },
      {
        name: 'TypeScript',
        hex: '#3178C6',
        hexAlpha: '#3178C633',
        icon: '/src/assets/Typescript.svg',
        color: 'text-blue-600',
      },
      {
        name: 'React',
        hex: '#61DAFB',
        hexAlpha: '#61DAFB33',
        icon: '/src/assets/react.svg',
        color: 'text-cyan-400',
        loading: 'eager',
      },
      {
        name: 'Astro',
        hex: '#FF5E00',
        hexAlpha: '#FF5E0033',
        icon: '/src/assets/AstroLogo.svg',
        color: 'text-orange-500',
        loading: 'eager',
      },
    ],
  },
  {
    title: 'Bases de datos',
    items: [
      {
        name: 'SQL',
        hex: '#4479A1',
        hexAlpha: '#4479A133',
        icon: '/src/assets/MySQL.svg',
        color: 'text-gray-900 dark:text-white',
        loading: 'eager',
      },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      {
        name: 'Git',
        hex: '#F1502F',
        hexAlpha: '#F1502F33',
        icon: '/src/assets/GitHub.svg',
        color: 'text-red-600',
        loading: 'lazy',
      },
      {
        name: 'VSCode',
        hex: '#007ACC',
        hexAlpha: '#007ACC33',
        icon: '/src/assets/VSCode.svg',
        color: 'text-blue-500',
        loading: 'lazy',
      },
      {
        name: 'Postman',
        hex: '#FF6C37',
        hexAlpha: '#FF6C3733',
        icon: '/src/assets/Postman.svg',
        color: 'text-orange-500',
        loading: 'lazy',
      },
    ],
  },
  {
    title: 'Diseño',
    items: [
      {
        name: 'Figma',
        hex: '#F24E1E',
        hexAlpha: '#F24E1E33',
        icon: '/src/assets/Figma.svg',
        color: 'text-pink-500',
        loading: 'lazy',
      },
      {
        name: 'Adobe Photoshop',
        hex: '#31A8FF',
        hexAlpha: '#31A8FF33',
        icon: '/src/assets/Photoshop.svg',
        color: 'text-blue-700',
        loading: 'lazy',
      },
      {
        name: 'Canva',
        hex: '#00C4CC',
        hexAlpha: '#00C4CC33',
        icon: '/src/assets/Canva.svg',
        color: 'text-teal-600',
        loading: 'lazy',
      },
    ],
  },
];
