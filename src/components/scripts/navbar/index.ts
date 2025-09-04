// src/scripts/navbar/index.ts
import { ThemeHelper } from '../theme';
import { initMobileMenu } from './mobileMenu';
import { initNavbarVisibility } from './navbarVisibility';
import { initSectionNavigation } from './sectionNavigation';

/**
 * Inicializa todas las funcionalidades de la navbar.
 */
export function initNavbar() {
  // === Inicializar tema ===
  ThemeHelper.initTheme();

  // Conectar toggle de tema
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', ThemeHelper.toggleTheme);

  // === Inicializar otras funcionalidades ===
  initMobileMenu();
  initNavbarVisibility();
  initSectionNavigation();
}

// Barrel export: permite importar ThemeHelper directo desde aquí si se necesita
export { ThemeHelper };
