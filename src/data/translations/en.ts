// Traducciones en inglés
import type { TranslationStructure } from './types';

export const enTranslations: TranslationStructure = {
  navbar: {
    home: 'Tech Stack',
    projects: 'Projects',
    about: 'About Me',
    contact: 'Contact',
  },
  personal: {
    name: 'Joaquin Calligaro',
    description:
      'Hello, I am a frontend developer who enjoys turning ideas into clear and functional interfaces. ' +
      'Currently, I am exploring web and mobile projects with a modern style focused on user experience. ' +
      'I invite you to check out my work.',
  },
  aboutMe: {
    title: 'About Me',
    shortBio: {
      heading: 'Short Bio',
      paragraphs: [
        'I am from La Rioja, Argentina, I am 24 years old and I started venturing into web development in 2022, although technology has always attracted me since I was a child. I enrolled in a University Technical Program in Programming at the National Technological University in Argentina.',
        'In my free time I like to design, structure, and constantly learn, creating new things that challenge me.',
        'I seek to contribute my knowledge in collaborative projects, receive feedback from other developers, and thus improve my skills.',
        'My current goal is to grow as a frontend developer, but also expand my experience towards backend and mobile.',
        'I am currently studying English and have an A2 level certificate, with the goal of continuing to advance.',
      ],
      cvHeading: 'CV Information',
      cvDownload: 'Download CV',
    },
    experience: {
      heading: 'Education',
    },
  },
  techStack: {
    heading: 'Tech Stack',
    categories: {
      frontend: 'Front-end',
      database: 'Database',
      tools: 'Tools',
      designTools: 'Design Tools',
    },
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
    jsCalculator: {
      title: 'Calculator',
      description:
        'A simple calculator built with HTML, CSS, Tailwind, and JavaScript. It allows performing basic operations within a modern, responsive, and minimalistic interface.',
    },
    todolist: {
      title: 'To do list App',
      description:
        'Allows users to add, mark as completed, and delete tasks. Data is saved in localStorage and it includes a light/dark mode for a better experience.',
    },
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
  experiences: [
    {
      dates: ' January 2024 - December 2024 (COMPLETED)',
      company: 'British Institute La Rioja',
      description:
        'Completed my A2 level English studies, improving my communication and comprehension skills in the language.',
      iconKey: 'university',
    },
    {
      dates: ' February 2022 - September 2024 (COMPLETED)',
      company: 'National Technological University (UTN)',
      description:
        'Completed the University Technical Program in Programming, acquiring solid knowledge in software development, algorithms and data structures.',
      iconKey: 'university',
    },
    {
      dates: 'February 2013 - December 2019 (COMPLETED)',
      company: 'Brigadier Gral. Juan Facundo Quiroga (EPET N°2)',
      description:
        'Completed my secondary studies with knowledge in control technologies (robotics) and basic programming.',
      iconKey: 'university',
    },
  ],
};
