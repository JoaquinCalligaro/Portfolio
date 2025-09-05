// Re-export from modular translation structure
export { translations } from './translations/index';
export type {
  Lang,
  TranslationStructure,
  AboutMe,
  ExperienceItem,
} from './translations/index';

// Import types for use in functions
import type { Lang, AboutMe, ExperienceItem } from './translations/index';
import { translations } from './translations/index';

/**
 * Typed accessor for aboutMe translations.
 * Use this in components to get a properly typed AboutMe object.
 */
export function getAboutMe(lang: Lang): AboutMe {
  // translations is `as const` so indexing is safe at runtime.
  // Provide a fallback minimal object to keep components robust.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = (translations as any)[lang]?.aboutMe as AboutMe | undefined;
  return (
    maybe ?? {
      title: lang === 'ES' ? 'Sobre Mí' : 'About Me',
      shortBio: {
        heading: lang === 'ES' ? 'Biografía breve' : 'Short Bio',
        paragraphs: [],
        cvHeading: lang === 'ES' ? 'Información CV' : 'CV Information',
        cvDownload: lang === 'ES' ? 'Descargar CV' : 'Download CV',
      },
      experience: {
        heading: lang === 'ES' ? 'Educación' : 'Education',
      },
    }
  );
}

export function getExperiences(lang: Lang): ExperienceItem[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = (translations as any)[lang]?.experiences as
    | ExperienceItem[]
    | undefined;
  return maybe ?? [];
}
