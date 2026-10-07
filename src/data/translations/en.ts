// Traducciones en inglés
import type { TranslationStructure } from './types';

export const enTranslations: TranslationStructure = {
  navbar: {
    home: 'Tech Stack',
    projects: 'Projects',
    about: 'About Me',
    contact: 'Contact',
  },
  aboutMe: {
    title: 'About Me',
    shortBio: {
      heading: 'Short Bio',
      cvHeading: 'CV Information',
      cvDownload: 'Download CV',
    },
    experience: {
      heading: 'Education',
    },
  },
  techStack: {
    heading: 'Tech Stack',
  },
  projects: {
    heading: 'My Projects',
  },
  buttons: {
    repo: 'Repository',
    demo: 'Demo',
  },
  contact: {
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    sent: 'Sent',
    sending: 'Sending...',
    nameRequired: 'Name is required.',
    invalidName: 'Name cannot contain numbers.',
    invalidNameChars:
      'Name may only contain letters, spaces, hyphens and apostrophes.',
    nameTooLong: 'Name is too long.',
    invalidEmail: 'Invalid email format.',
    messageMinLength: 'The message must be at least 10 characters.',
    messageCharCount: 'Missing ${count} characters (minimum 10).',
    characterLimitExceeded:
      'Character limit exceeded. Maximum ${max} characters allowed.',
    sentSuccess: 'Message sent!',
    sendError: 'An error occurred while sending. Try again.',
    cooldownWait: 'Please wait ${timeStr} before sending another message.',
  },
  showMore: {
    showAll: 'Show all (${total})',
    hide: 'Hide',
  },
};
