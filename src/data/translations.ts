export const translations = {
  ES: {
    navbar: {
      // rotated: home <- old tech, tech <- old projects, projects <- old about, about <- old home
      home: 'Tecnologias',
      tech: 'Proyectos',
      projects: 'Sobre Mí',
      about: 'Inicio',
      contact: 'Contactame',
    },
    personal: {
      name: 'Joaquin Calligaro',
      description:
        'Soy desarrollador frontend junior con experiencia en HTML, CSS y JavaScript. Actualmente trabajo con React, Tailwind y Astro, creando proyectos prácticos que combinan diseño moderno, rendimiento y buenas prácticas de desarrollo.',
    },
    aboutMe: {
      title: 'Sobre Mí',
      shortBio: {
        heading: 'Biografía breve',
        paragraphs: [
          'Soy un desarrollador frontend con interés en crear interfaces limpias y accesibles. Me especializo en convertir diseños en experiencias web eficientes y responsivas.',
          'Trabajo a diario con HTML, CSS y JavaScript, y me apoyo en herramientas modernas como Astro, Tailwind y frameworks componentizados para entregar productos mantenibles.',
          'Me apasiona el rendimiento y las buenas prácticas; disfruto optimizar cargas, mejorar la experiencia de usuario y aprender nuevas técnicas para crear productos confiables.',
        ],
        cvHeading: 'Información CV',
        cvDownload: 'Descargar CV',
      },
      experience: {
        heading: 'Experiencia Profesional',
      },
    },
    techStack: {
      heading: 'Stack Tecnológico',
    },

    projects: {
      heading: 'Mis Proyectos',
      backgroundGenerator: {
        title: 'Background Generator',
        description:
          'Generador de fondos animados con múltiples diseños predefinidos y más de 26 animaciones personalizables en tiempo real.',
      },
      organicStore: {
        title: 'Organic Store',
        description:
          'Tienda en línea de productos orgánicos y saludables, con catálogo claro y ordenado. Diseñada para una navegación simple y una experiencia de compra agradable.',
      },
      passwordGenerator: {
        title: 'Generador de contraseñas',
        description:
          'Generador de contraseñas seguras con interfaz moderna.Incluye sistema de fortaleza visual, modo oscuro/claro automático y animaciones fluidas.',
      },
      gifApp: {
        title: 'Gif App',
        description:
          'Aplicación Gif-App es una aplicación web que permite a los usuarios buscar, ver y compartir GIFs fácilmente. Utiliza la API de GIPHY para obtener GIFs en tendencia y populares',
      },
      jsCalculator: {
        title: 'Calculadora',
        description:
          'Una calculadora sencilla desarrollada con HTML, CSS, Tailwind y JS. Permite realizar operaciones básicas en una interfaz moderna, responsiva y minimalista.',
      },
      todolist: {
        title: 'To do list App',
        description:
          'Permite agregar, marcar como completadas y eliminar tareas. Los datos se guardan en localStorage y cuenta con modo claro/oscuro para una mejor experiencia.',
      },
    },
    buttons: {
      repo: 'Repositorio',
      live: 'Demo',
    },
    showMore: {
      showAll: 'Ver Todos (${total})',
      hide: 'Ocultar',
    },
    experiences: [
      {
        dates: ' January 2025- Present',
        company: 'University of Camagüey',
        description:
          'Participé en proyectos de desarrollo web para entornos educativos, diseñando interfaces para recursos de aprendizaje y mejorando la accesibilidad y usabilidad de contenidos en línea.',
        svgIcon:
          "<svg class='size-4 text-gray-600 dark:text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'> <path stroke-linecap='round' stroke-width='2' d='M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2' /> <path stroke-linecap='round' stroke-width='2' d='M4 14l3.15.787a20 20 0 009.7 0L20 14' /> <path stroke-linejoin='round' stroke-width='2' d='M4 10a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z' /><circle cx='12' cy='12' r='1' /></svg>",
      },
      {
        dates: ' January 2025- February 2025',
        company: 'No Country Tech Work Simulation',
        description:
          'Simulación práctica de trabajo en equipo donde prototipamos funciones, integramos APIs y aplicamos metodologías ágiles para resolver casos reales de producto.',
        svgIcon:
          "<svg class='size-4  text-gray-600 dark:text-gray-400' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M19 1C19 0.447715 19.4477 0 20 0C20.5523 0 21 0.447715 21 1V1.58582L22.2709 0.314894C22.6614 -0.0756305 23.2946 -0.0756294 23.6851 0.314895C24.0757 0.705419 24.0757 1.33858 23.6851 1.72911L22.4142 3H23C23.5523 3 24 3.44772 24 4C24 4.55228 23.5523 5 23 5H20.4142L12.7017 12.7125C12.3112 13.103 11.678 13.103 11.2875 12.7125C10.897 12.322 10.897 11.6888 11.2875 11.2983L19 3.58582V1Z' /><path d='M17.3924 3.78908C17.834 3.3475 17.7677 2.61075 17.2182 2.31408C15.6655 1.47581 13.8883 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 10.1154 22.5261 8.34153 21.6909 6.79102C21.3946 6.24091 20.6574 6.17424 20.2155 6.61606L20.1856 6.64598C19.8554 6.97615 19.8032 7.48834 20.016 7.90397C20.6451 9.1326 21 10.5249 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C13.4782 3 14.8732 3.35638 16.1037 3.98791C16.5195 4.20129 17.0322 4.14929 17.3627 3.81884L17.3924 3.78908Z' /><path d='M14.3899 6.79159C14.8625 6.31902 14.7436 5.52327 14.1062 5.32241C13.4415 5.11295 12.7339 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 11.2702 18.8883 10.5664 18.6811 9.9049C18.4811 9.26659 17.6846 9.14697 17.2117 9.61995L17.1194 9.71224C16.8382 9.99337 16.7595 10.4124 16.8547 10.7984C16.9496 11.1833 17 11.5858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C12.4172 7 12.8225 7.0511 13.21 7.1474C13.5965 7.24347 14.0166 7.16496 14.2982 6.88331L14.3899 6.79159Z' /><path d='M11.078 9.15136C11.4874 9.01484 11.6934 9.48809 11.3882 9.79329L10.5827 10.5989C9.80254 11.379 9.80254 12.6438 10.5827 13.4239C11.3628 14.204 12.6276 14.204 13.4077 13.4239L14.2031 12.6285C14.5089 12.3227 14.9822 12.5301 14.8429 12.9397C14.441 14.1209 13.3135 15 12 15C10.3431 15 9 13.6569 9 12C9 10.6796 9.88827 9.54802 11.078 9.15136Z' /></svg>",
      },
      {
        dates: 'August 2024 - November 2024',
        company: 'GotoSend',
        description:
          'Colaboré en el frontend de la plataforma, implementando componentes reutilizables, mejorando la consistencia visual y optimizando tiempos de carga en interfaces de usuario.',
        svgIcon:
          "<svg class='size-4 text-gray-600 dark:text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'> <path stroke-linecap='round' stroke-width='2' d='M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2' /> <path stroke-linecap='round' stroke-width='2' d='M4 14l3.15.787a20 20 0 009.7 0L20 14' /> <path stroke-linejoin='round' stroke-width='2' d='M4 10a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z' /><circle cx='12' cy='12' r='1' /></svg>",
      },
    ],
  },
  EN: {
    navbar: {
      // rotated: home <- old tech, tech <- old projects, projects <- old about, about <- old home
      home: 'Tech Stack',
      tech: 'Projects',
      projects: 'About',
      about: 'Home',
      contact: 'Contact',
    },
    personal: {
      name: 'Joaquin Calligaro',
      description:
        'I am a junior frontend developer with experience in HTML, CSS and JavaScript. I work with React, Tailwind and Astro, building practical projects that combine modern design, performance and good development practices.',
    },
    aboutMe: {
      title: 'About Me',
      shortBio: {
        heading: 'Short Bio',
        paragraphs: [
          'I am a frontend developer focused on building clean, accessible interfaces. I turn visual designs into responsive web experiences that perform well across devices.',
          'I work daily with HTML, CSS, and JavaScript, and use modern tools like Astro and Tailwind to ship maintainable, component-driven projects.',
          'I enjoy improving performance, reducing load times, and applying best practices to create reliable user experiences.',
        ],
        cvHeading: 'CV Information',
        cvDownload: 'Download CV',
      },
      experience: {
        heading: 'Professional Experience',
      },
    },
    techStack: {
      heading: 'Tech Stack',
    },
    projects: {
      heading: 'My Projects',
      backgroundGenerator: {
        title: 'Background Generator',
        description:
          'Animated background generator with multiple presets and 26+ customizable animations.',
      },
      organicStore: {
        title: 'Organic Store',
        description:
          'Simple online store for organic products with a clean catalog and easy navigation.',
      },
      passwordGenerator: {
        title: 'Password Generator',
        description:
          'Secure password generator with a modern interface. Includes a visual strength indicator, automatic dark/light mode, and smooth animations.',
      },
      gifApp: {
        title: 'Gif App',
        description:
          'Gif-App is a web application that allows users to search, view, and share GIFs easily. It uses the GIPHY API to fetch trending and popular GIFs',
      },
      todolist: {
        title: 'To do list App',
        description:
          'Allows users to add, mark as completed, and delete tasks. Data is saved in localStorage and it includes a light/dark mode for a better experience.',
      },

      jsCalculator: {
        title: 'Calculator',
        description:
          'A simple calculator built with HTML, CSS, Tailwind, and JavaScript. It allows performing basic operations within a modern, responsive, and minimalistic interface.',
      },
    },
    buttons: {
      repo: 'Repository',
      live: 'Live',
    },
    showMore: {
      showAll: 'Show all (${total})',
      hide: 'Hide',
    },
    experiences: [
      {
        dates: ' January 2025- Present',
        company: 'University of Camagüey',
        description:
          'Worked on educational web development projects, designing interfaces for learning resources and improving the accessibility and usability of online content.',
        svgIcon:
          "<svg class='size-4 text-gray-600 dark:text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'> <path stroke-linecap='round' stroke-width='2' d='M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2' /> <path stroke-linecap='round' stroke-width='2' d='M4 14l3.15.787a20 20 0 009.7 0L20 14' /> <path stroke-linejoin='round' stroke-width='2' d='M4 10a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z' /><circle cx='12' cy='12' r='1' /></svg>",
      },
      {
        dates: ' January 2025- February 2025',
        company: 'No Country Tech Work Simulation',
        description:
          'Hands-on teamwork simulation where we prototyped features, integrated APIs, and applied agile methodologies to solve real-world product cases.',
        svgIcon:
          "<svg class='size-4  text-gray-600 dark:text-gray-400' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M19 1C19 0.447715 19.4477 0 20 0C20.5523 0 21 0.447715 21 1V1.58582L22.2709 0.314894C22.6614 -0.0756305 23.2946 -0.0756294 23.6851 0.314895C24.0757 0.705419 24.0757 1.33858 23.6851 1.72911L22.4142 3H23C23.5523 3 24 3.44772 24 4C24 4.55228 23.5523 5 23 5H20.4142L12.7017 12.7125C12.3112 13.103 11.678 13.103 11.2875 12.7125C10.897 12.322 10.897 11.6888 11.2875 11.2983L19 3.58582V1Z' /><path d='M17.3924 3.78908C17.834 3.3475 17.7677 2.61075 17.2182 2.31408C15.6655 1.47581 13.8883 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 10.1154 22.5261 8.34153 21.6909 6.79102C21.3946 6.24091 20.6574 6.17424 20.2155 6.61606L20.1856 6.64598C19.8554 6.97615 19.8032 7.48834 20.016 7.90397C20.6451 9.1326 21 10.5249 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C13.4782 3 14.8732 3.35638 16.1037 3.98791C16.5195 4.20129 17.0322 4.14929 17.3627 3.81884L17.3924 3.78908Z' /><path d='M14.3899 6.79159C14.8625 6.31902 14.7436 5.52327 14.1062 5.32241C13.4415 5.11295 12.7339 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 11.2702 18.8883 10.5664 18.6811 9.9049C18.4811 9.26659 17.6846 9.14697 17.2117 9.61995L17.1194 9.71224C16.8382 9.99337 16.7595 10.4124 16.8547 10.7984C16.9496 11.1833 17 11.5858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C12.4172 7 12.8225 7.0511 13.21 7.1474C13.5965 7.24347 14.0166 7.16496 14.2982 6.88331L14.3899 6.79159Z' /><path d='M11.078 9.15136C11.4874 9.01484 11.6934 9.48809 11.3882 9.79329L10.5827 10.5989C9.80254 11.379 9.80254 12.6438 10.5827 13.4239C11.3628 14.204 12.6276 14.204 13.4077 13.4239L14.2031 12.6285C14.5089 12.3227 14.9822 12.5301 14.8429 12.9397C14.441 14.1209 13.3135 15 12 15C10.3431 15 9 13.6569 9 12C9 10.6796 9.88827 9.54802 11.078 9.15136Z' /></svg>",
      },
      {
        dates: 'August 2024 - November 2024',
        company: 'GotoSend',
        description:
          "Collaborated on the platform's frontend, implementing reusable components, improving visual consistency, and optimizing load times in user interfaces.",
        svgIcon:
          "<svg class='size-4 text-gray-600 dark:text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'> <path stroke-linecap='round' stroke-width='2' d='M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2' /> <path stroke-linecap='round' stroke-width='2' d='M4 14l3.15.787a20 20 0 009.7 0L20 14' /> <path stroke-linejoin='round' stroke-width='2' d='M4 10a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z' /><circle cx='12' cy='12' r='1' /></svg>",
      },
    ],
  },
} as const;

export type Lang = keyof typeof translations;

export type AboutMe = {
  title: string;
  shortBio: {
    heading: string;
    paragraphs: string[];
    cvHeading: string;
    cvDownload: string;
  };
  experience: {
    heading: string;
  };
};

/**
 * Typed accessor for aboutMe translations.
 * Use this in components to get a properly typed AboutMe object.
 */
export function getAboutMe(lang: Lang): AboutMe {
  // translations is `as const` so indexing is safe at runtime.
  // Provide a fallback minimal object to keep components robust.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = (translations as any)[lang]?.aboutMe as AboutMe | undefined;
  return (
    maybe ?? {
      title: lang === 'ES' ? 'Sobre Mí' : 'About Me',
      shortBio: {
        heading: lang === 'ES' ? 'Biografía breve' : 'Short Bio',
        paragraphs: [],
        cvHeading: lang === 'ES' ? 'Información CV' : 'CV Information',
        cvDownload: lang === 'ES' ? 'Descargar CV' : 'Download CV',
      },
      experience: {
        heading:
          lang === 'ES' ? 'Experiencia Profesional' : 'Professional Experience',
      },
    }
  );
}

export type ExperienceItem = {
  dates: string;
  company: string;
  description: string;
  svgIcon?: string;
};

export function getExperiences(lang: Lang): ExperienceItem[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = (translations as any)[lang]?.experiences as
    | ExperienceItem[]
    | undefined;
  return maybe ?? [];
}
