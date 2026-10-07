// Tipos TypeScript para el sistema de traducciones
export type Lang = 'ES' | 'EN';

// Estructura para la sección "Sobre Mí"
export type AboutMe = {
  title: string;
  shortBio: {
    heading: string;
    cvHeading: string;
    cvDownload: string;
  };
  experience: {
    heading: string;
  };
};

// Estructura principal de las traducciones: solo textos chicos de interfaz.
// El contenido personal (nombre, bio, stack, educación, proyectos) vive en la base de datos.
export interface TranslationStructure {
  navbar: {
    home: string;
    projects: string;
    about: string;
    contact: string;
  };
  aboutMe: AboutMe;
  techStack: {
    heading: string;
  };
  projects: {
    heading: string;
  };
  buttons: {
    repo: string;
    demo: string;
  };
  contact: {
    name: string;
    email: string;
    message: string;
    send: string;
    sent: string;
    sending: string;
    nameRequired: string;
    invalidName: string;
    invalidNameChars: string;
    nameTooLong: string;
    invalidEmail: string;
    messageMinLength: string;
    messageCharCount: string;
    characterLimitExceeded: string;
    sentSuccess: string;
    sendError: string;
    cooldownWait: string;
  };
  showMore: {
    showAll: string;
    hide: string;
  };
}
