import { esTranslations } from './es';
import { enTranslations } from './en';

export const translations = {
  ES: esTranslations,
  EN: enTranslations,
} as const;

export type {
  Lang,
  TranslationStructure,
  AboutMe,
  ExperienceItem,
} from './types';
