export type Lang = 'ES' | 'EN';

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

export type ExperienceItem = {
  dates: string;
  company: string;
  description: string;
  svgIcon?: string;
};

export interface TranslationStructure {
  navbar: {
    home: string;
    projects: string;
    about: string;
    contact: string;
  };
  personal: {
    name: string;
    description: string;
  };
  aboutMe: AboutMe;
  techStack: {
    heading: string;
    categories: {
      frontend: string;
      database: string;
      tools: string;
      designTools: string;
    };
  };
  projects: {
    heading: string;
    backgroundGenerator: {
      title: string;
      description: string;
    };
    organicStore: {
      title: string;
      description: string;
    };
    passwordGenerator: {
      title: string;
      description: string;
    };
    gifApp: {
      title: string;
      description: string;
    };
    jsCalculator: {
      title: string;
      description: string;
    };
    todolist: {
      title: string;
      description: string;
    };
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
  experiences: ExperienceItem[];
}
