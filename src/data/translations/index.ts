// Punto de entrada principal para el sistema de traducciones
import { esTranslations } from './es';
import { enTranslations } from './en';

// Exporta todas las traducciones organizadas por idioma
export const translations = {
  ES: esTranslations,
  EN: enTranslations,
} as const;

// Exporta los tipos para usar en otros archivos
export type {
  Lang,
  TranslationStructure,
  AboutMe,
  ExperienceItem,
} from './types';
