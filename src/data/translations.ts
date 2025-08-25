export const translations = {
  ES: {
    navbar: {
      home: 'Inicio',
      tech: 'Tecnologias',
      projects: 'Proyectos',
      services: 'Servicios',
    },
    personal: {
      name: 'Joaquin Calligaro',
      description:
        'Soy desarrollador frontend junior con experiencia en HTML, CSS y JavaScript. Actualmente trabajo con React, Tailwind y Astro, creando proyectos prácticos que combinan diseño moderno, rendimiento y buenas prácticas de desarrollo.',
    },
    techStack: {
      heading: 'Stack Tecnológico',
    },
    projects: {
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
    },
    buttons: {
      repo: 'Repositorio',
      demo: 'Demo',
    },
  },
  EN: {
    navbar: {
      home: 'Home',
      tech: 'Tech Stack',
      projects: 'Projects',
      services: 'Services',
    },
    personal: {
      name: 'Joaquin Calligaro',
      description:
        'I am a junior frontend developer with experience in HTML, CSS and JavaScript. I work with React, Tailwind and Astro, building practical projects that combine modern design, performance and good development practices.',
    },
    techStack: {
      heading: 'Tech Stack',
    },
    projects: {
      backgroundGenerator: {
        title: 'Background Generator',
        description:
          'Background generator with multiple predefined designs and over 26 customizable animations in real time.',
      },
      organicStore: {
        title: 'Organic Store',
        description:
          'Online store for organic and healthy products, with a clear, well-organized catalogue. Designed for simple navigation and a pleasant buying experience.',
      },
    },
    buttons: {
      repo: 'Repository',
      demo: 'Live',
    },
  },
} as const;

export type Lang = keyof typeof translations;
