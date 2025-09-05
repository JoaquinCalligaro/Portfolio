// Traducciones en español
import type { TranslationStructure } from './types';

export const esTranslations: TranslationStructure = {
  navbar: {
    home: 'Stack Tecnológico',
    projects: 'Proyectos',
    about: 'Sobre Mí',
    contact: 'Contactame',
  },
  personal: {
    name: 'Joaquin Calligaro',
    description:
      'Hola, soy un desarrollador frontend que disfruta transformar ideas en interfaces claras y funcionales. ' +
      'Actualmente exploro proyectos web y móviles con un estilo moderno y enfocado en la experiencia del usuario. ' +
      'Te invito a ver mi trabajo.',
  },
  aboutMe: {
    title: 'Sobre Mí',
    shortBio: {
      heading: 'Biografía breve',
      paragraphs: [
        'Soy de La Rioja, Argentina, y comencé a incursionar en el desarrollo web en 2022, aunque desde chico siempre me atrajo la tecnología. Me anoté en una carrera de Técnicatura Universitaria en Programación en la Universidad Tecnológica Nacional en Argentina.',
        'En mis tiempos libres me gusta diseñar, estructurar y aprender constantemente, creando cosas nuevas que me desafíen.',
        'Busco aportar mis conocimientos en proyectos colaborativos, recibir feedback de otros desarrolladores y así mejorar mis habilidades.',
        'Mi meta actual es crecer como frontend developer, pero también ampliar mi experiencia hacia backend y mobile.',
        'Actualmente estudio inglés en la UNLaR y cuento con un certificado de nivel A2, con la meta de seguir avanzando para proyectarme en un entorno internacional.',
      ],
      cvHeading: 'Información CV',
      cvDownload: 'Descargar CV',
    },
    experience: {
      heading: 'Educación',
    },
  },
  techStack: {
    heading: 'Stack Tecnológico',
    categories: {
      frontend: 'Front-end',
      database: 'Bases de datos',
      tools: 'Herramientas',
      designTools: 'Herramientas de diseño',
    },
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
    demo: 'Demo',
  },
  contact: {
    name: 'Nombre',
    email: 'Email',
    message: 'Mensaje',
    send: 'Enviar',
    sent: 'Enviado',
    sending: 'Enviando...',
    nameRequired: 'El nombre es requerido.',
    invalidName: 'El nombre no puede contener números.',
    invalidNameChars:
      'El nombre solo puede contener letras, espacios, guiones y apóstrofes.',
    nameTooLong: 'El nombre es demasiado largo.',
    invalidEmail: 'Formato de email inválido.',
    messageMinLength: 'El mensaje debe tener al menos 10 caracteres.',
    messageCharCount: 'Faltan ${count} caracteres (mínimo 10).',
    characterLimitExceeded:
      'Límite de caracteres excedido. Máximo ${max} caracteres permitidos.',
    sentSuccess: 'Mensaje enviado.',
    sendError: 'Ocurrió un error al enviar. Intenta de nuevo.',
    cooldownWait: 'Espera ${timeStr} antes de enviar otro mensaje.',
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
    },
    {
      dates: ' January 2025- February 2025',
      company: 'No Country Tech Work Simulation',
      description:
        'Simulación práctica de trabajo en equipo donde prototipamos funciones, integramos APIs y aplicamos metodologías ágiles para resolver casos reales de producto.',
    },
    {
      dates: 'August 2024 - November 2024',
      company: 'GotoSend',
      description:
        'Colaboré en el frontend de la plataforma, implementando componentes reutilizables, mejorando la consistencia visual y optimizando tiempos de carga en interfaces de usuario.',
    },
  ],
};
