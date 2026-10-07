// Traducciones en español
import type { TranslationStructure } from './types';

export const esTranslations: TranslationStructure = {
  navbar: {
    home: 'Stack Tecnológico',
    projects: 'Proyectos',
    about: 'Sobre Mí',
    contact: 'Contactame',
  },
  aboutMe: {
    title: 'Sobre Mí',
    shortBio: {
      heading: 'Biografía breve',
      cvHeading: 'Información CV',
      cvDownload: 'Descargar CV',
    },
    experience: {
      heading: 'Educación',
    },
  },
  techStack: {
    heading: 'Stack Tecnológico',
  },
  projects: {
    heading: 'Mis Proyectos',
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
};
