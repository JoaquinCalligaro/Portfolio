// Archivo principal de traducciones - Re-exporta desde la estructura modular
export { translations } from './translations/index';
export type {
  Lang,
  TranslationStructure,
  AboutMe,
  ExperienceItem,
} from './translations/index';

// Tipos para las funciones auxiliares
import type { Lang, AboutMe, ExperienceItem } from './translations/index';
import { translations } from './translations/index';

/**
 * Obtiene las traducciones de "Sobre Mí" con tipado seguro
 */
export function getAboutMe(lang: Lang): AboutMe {
  // Acceso seguro con fallback en caso de error
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

/**
 * Obtiene la lista de experiencias laborales
 */
export function getExperiences(lang: Lang): ExperienceItem[] {
  // Obtiene experiencias con fallback a array vacío
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = (translations as any)[lang]?.experiences as
    | ExperienceItem[]
    | undefined;
  return maybe ?? [];
}
