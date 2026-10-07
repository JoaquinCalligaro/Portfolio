// Archivo principal de traducciones - Re-exporta desde la estructura modular.
// Solo contiene textos chicos de interfaz; el contenido personal está en la base.
export { translations } from './translations/index';
export type { Lang, TranslationStructure, AboutMe } from './translations/index';

import type { Lang, AboutMe } from './translations/index';
import { translations } from './translations/index';

/**
 * Obtiene los textos de interfaz de "Sobre Mí" con tipado seguro
 */
export function getAboutMe(lang: Lang): AboutMe {
  return translations[lang].aboutMe;
}
