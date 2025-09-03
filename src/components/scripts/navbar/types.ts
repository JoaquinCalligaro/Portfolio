// src/scripts/navbar/types.ts

/**
 * IDs de las secciones reales en el documento (sections <section id="...">).
 * Se usan en IntersectionObserver y smooth scroll.
 */
export type SectionId = 'tech-stack' | 'projects' | 'about' | 'contact';

/**
 * IDs de los radios en la navegación desktop.
 * Deben coincidir con los atributos `id` de los <input type="radio"> en NavbarDesktop.astro.
 */
export type NavRadioId =
  | 'nav-tech-stack'
  | 'nav-projects'
  | 'nav-about'
  | 'nav-contact';

/**
 * Configuración común de la navbar.
 * Centraliza referencias a los elementos clave para evitar duplicar querySelectors.
 */
export interface NavbarConfig {
  navbar: HTMLElement | null;
  navbarHeader: HTMLElement | null;
  navbarToggle: HTMLElement | null;
  navbarMenuIcon: HTMLElement | null;
  navbarXIcon: HTMLElement | null;
}
