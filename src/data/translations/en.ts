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
      dates: ' January 2025- Present',
      company: 'University of Camagüey',
      description:
        'Worked on educational web development projects, designing interfaces for learning resources and improving the accessibility and usability of online content.',
    },
    {
      dates: ' January 2025- February 2025',
      company: 'No Country Tech Work Simulation',
      description:
        'Hands-on teamwork simulation where we prototyped features, integrated APIs, and applied agile methodologies to solve real-world product cases.',
    },
    {
      dates: 'August 2024 - November 2024',
      company: 'GotoSend',
      description:
        "Collaborated on the platform's frontend, implementing reusable components, improving visual consistency, and optimizing load times in user interfaces.",
    },
  ],
};
