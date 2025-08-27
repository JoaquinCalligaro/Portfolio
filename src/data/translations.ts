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
  },
} as const;

export type Lang = keyof typeof translations;
