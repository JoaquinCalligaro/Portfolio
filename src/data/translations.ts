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
    },
    buttons: {
      repo: 'Repositorio',
      live: 'Demo',
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
    },
    buttons: {
      repo: 'Repository',
      live: 'Live',
    },
  },
} as const;

export type Lang = keyof typeof translations;
