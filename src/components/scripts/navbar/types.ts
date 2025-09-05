// Tipos TypeScript para el sistema de navegación

/**
 * IDs de las secciones principales del sitio
 */
export type SectionId = 'tech-stack' | 'projects' | 'about' | 'contact';

/**
 * IDs de los controles de navegación desktop
 */
export type NavRadioId =
  | 'nav-tech-stack'
  | 'nav-projects'
  | 'nav-about'
  | 'nav-contact';

/**
 * Configuración de elementos del navbar
 */
export interface NavbarConfig {
  navbar: HTMLElement | null;
  navbarHeader: HTMLElement | null;
  navbarToggle: HTMLElement | null;
  navbarMenuIcon: HTMLElement | null;
  navbarXIcon: HTMLElement | null;
}
