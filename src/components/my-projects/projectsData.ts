// Importaciones de imágenes
import bgGenerator1 from '../../assets/images/BackgroundGenerator/Bg-Generator.webp';
import bgGenerator2 from '../../assets/images/BackgroundGenerator/Bg-Generator-2.webp';
import bgGenerator3 from '../../assets/images/BackgroundGenerator/Bg-Generator-3.webp';

import organicStore1 from '../../assets/images/OrganicStore/organic-store-1.webp';
import organicStore2 from '../../assets/images/OrganicStore/organic-store-2.webp';
import organicStore3 from '../../assets/images/OrganicStore/organic-store-3.webp';
import organicStore4 from '../../assets/images/OrganicStore/organic-store-4.webp';
import organicStore5 from '../../assets/images/OrganicStore/organic-store-5.webp';

import passwordGen1 from '../../assets/images/password-generator/Password-Generator-1.webp';
import passwordGen2 from '../../assets/images/password-generator/Password-Generator-2.webp';
import passwordGen3 from '../../assets/images/password-generator/Password-Generator-3.webp';

import gifApp1 from '../../assets/images/gif-app/gif-app-1.webp';
import gifApp2 from '../../assets/images/gif-app/gif-app-2.webp';
import gifApp3 from '../../assets/images/gif-app/gif-app-3.webp';

import todoList1 from '../../assets/images/to-do-list/to-do-list-1.webp';
import todoList2 from '../../assets/images/to-do-list/to-do-list-2.webp';
import todoList3 from '../../assets/images/to-do-list/to-do-list-3.webp';
import todoList4 from '../../assets/images/to-do-list/to-do-list-4.webp';
import todoList5 from '../../assets/images/to-do-list/to-do-list-5.webp';

import calculator1 from '../../assets/images/js-calculator/js-calculator-1.webp';
import calculator2 from '../../assets/images/js-calculator/js-calculator-2.webp';

import type { ImageMetadata } from 'astro';

export type Project = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  repo: string;
  live: string;
  technologies: string[];
  images: ImageMetadata[]; // Usar ImageMetadata en lugar de any[]
  hidden?: boolean; // Propiedad opcional para ocultar proyectos
};

export const projectsData: Project[] = [
  {
    id: 'background-generator',
    titleKey: 'projects.backgroundGenerator.title',
    descriptionKey: 'projects.backgroundGenerator.description',
    repo: 'https://github.com/JoaquinCalligaro/Background-Generator',
    live: 'https://background-generator-final.netlify.app/',
    technologies: [
      'html',
      'css',
      'tailwind',
      'javascript',
      'typescript',
      'react',
    ],
    images: [bgGenerator1, bgGenerator2, bgGenerator3],
    hidden: false,
  },

  {
    id: 'organic-store',
    titleKey: 'projects.organicStore.title',
    descriptionKey: 'projects.organicStore.description',
    repo: 'https://github.com/JoaquinCalligaro/Organic-Store',
    live: 'https://joaquincalligaro.github.io/Organic-Store/index.html',
    technologies: ['html', 'css'],
    images: [
      organicStore1,
      organicStore2,
      organicStore3,
      organicStore4,
      organicStore5,
    ],
    hidden: true, // Ejemplo de proyecto oculto para pruebas
  },

  {
    id: 'password-generator',
    titleKey: 'projects.passwordGenerator.title',
    descriptionKey: 'projects.passwordGenerator.description',
    repo: 'https://github.com/JoaquinCalligaro/Password-Generator',
    live: 'https://password-generatorjc.netlify.app/',
    technologies: ['html', 'css', 'tailwind', 'javascript', 'typescript'],
    images: [passwordGen1, passwordGen2, passwordGen3],
    hidden: false,
  },

  {
    id: 'gif-app',
    titleKey: 'projects.gifApp.title',
    descriptionKey: 'projects.gifApp.description',
    repo: 'https://github.com/JoaquinCalligaro/Gif-App',
    live: 'https://gif-app-beta.netlify.app/',
    technologies: [
      'html',
      'css',
      'tailwind',
      'javascript',
      'typescript',
      'react',
    ],
    images: [gifApp1, gifApp2, gifApp3],
    hidden: false,
  },

  {
    id: 'todolist',
    titleKey: 'projects.todolist.title',
    descriptionKey: 'projects.todolist.description',
    repo: 'https://github.com/JoaquinCalligaro/To-Do-List',
    live: 'https://joaquincalligaro.github.io/To-Do-List/',
    technologies: ['html', 'css', 'tailwind', 'javascript'],
    images: [todoList1, todoList2, todoList3, todoList4, todoList5],
    hidden: true, // Ejemplo de proyecto oculto para pruebas
  },

  {
    id: 'calculator',
    titleKey: 'projects.jsCalculator.title',
    descriptionKey: 'projects.jsCalculator.description',
    repo: 'https://github.com/JoaquinCalligaro/Javascript-Calculator',
    live: 'https://calculatorjc.netlify.app/',
    technologies: ['html', 'css', 'tailwind', 'javascript'],
    images: [calculator1, calculator2],
    hidden: false,
  },
];
