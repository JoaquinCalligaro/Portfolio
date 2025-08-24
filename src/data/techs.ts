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
        icon: '/svg/html.svg',
        color: 'text-orange-500',
      },
      {
        name: 'CSS3',
        hex: '#1572B6',
        hexAlpha: '#1572B633',
        icon: '/svg/CSS.svg',
        color: 'text-blue-600',
      },
      {
        name: 'Sass',
        hex: '#CC6699',
        hexAlpha: '#CC669933',
        icon: '/svg/SASS.svg',
        color: 'text-pink-500',
      },
      {
        name: 'Tailwind CSS',
        hex: '#06B6D4',
        hexAlpha: '#06B6D433',
        icon: '/svg/TailwindCSS.svg',
        color: 'text-teal-500',
      },
      {
        name: 'JavaScript',
        hex: '#F7DF1E',
        hexAlpha: '#F7DF1E33',
        icon: '/svg/Javascript.svg',
        color: 'text-yellow-500',
      },
      {
        name: 'TypeScript',
        hex: '#3178C6',
        hexAlpha: '#3178C633',
        icon: '/svg/Typescript.svg',
        color: 'text-blue-600',
      },
      {
        name: 'React',
        hex: '#61DAFB',
        hexAlpha: '#61DAFB33',
        icon: '/svg/react.svg',
        color: 'text-cyan-400',
      },
      {
        name: 'Astro',
        hex: '#FF5E00',
        hexAlpha: '#FF5E0033',
        icon: '/svg/Astro.svg',
        color: 'text-orange-500',
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
        icon: '/svg/MySQL.svg',
        color: 'text-gray-900 dark:text-white',
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
        icon: '/svg/Git.svg',
        color: 'text-red-600',
        loading: 'lazy',
      },
      {
        name: 'VSCode',
        hex: '#007ACC',
        hexAlpha: '#007ACC33',
        icon: '/svg/VSCode.svg',
        color: 'text-blue-500',
        loading: 'lazy',
      },
      {
        name: 'Postman',
        hex: '#FF6C37',
        hexAlpha: '#FF6C3733',
        icon: '/svg/Postman.svg',
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
        icon: '/svg/Figma.svg',
        color: 'text-pink-500',
        loading: 'lazy',
      },
      {
        name: 'Adobe Photoshop',
        hex: '#31A8FF',
        hexAlpha: '#31A8FF33',
        icon: '/svg/Photoshop.svg',
        color: 'text-blue-700',
        loading: 'lazy',
      },
      {
        name: 'Canva',
        hex: '#00C4CC',
        hexAlpha: '#00C4CC33',
        icon: '/svg/Canva.svg',
        color: 'text-teal-600',
        loading: 'lazy',
      },
    ],
  },
];
