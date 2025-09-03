// src/scripts/navbar/glassNavigation.ts
import type { NavRadioId, SectionId } from './types';

/**
 * Inicializa la navegación "glass" en desktop.
 * - Smooth scroll al hacer click en los labels
 * - Marca la sección activa usando IntersectionObserver
 */
export function initGlassNavigation() {
  const glassNavLabels = document.querySelectorAll<HTMLLabelElement>(
    '.glass-nav-wrapper label'
  );

  // Smooth scroll en navegación glass
  glassNavLabels.forEach((label) => {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const target = label.getAttribute('data-target');

      if (target) {
        const targetElement = document.querySelector(target);

        if (targetElement) {
          // Usar un método más confiable de scroll
          const rect = targetElement.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const targetTop = rect.top + scrollTop - 100; // offset para el navbar

          window.scrollTo({
            top: targetTop,
            behavior: 'smooth',
          });
        }
      }
    });
  });

  // IDs de las secciones reales en el documento (sin # en este array)
  const sections: SectionId[] = ['tech-stack', 'projects', 'about', 'contact'];
  // IDs de los radios que corresponden a cada sección
  const ids: NavRadioId[] = [
    'nav-tech-stack',
    'nav-projects',
    'nav-about',
    'nav-contact',
  ];

  // Observer para marcar la sección activa
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionIndex = sections.findIndex(
            (s) => s === entry.target.id // 👈 ahora compara con id real de <section>
          );
          if (sectionIndex !== -1) {
            const radioInput = document.getElementById(
              ids[sectionIndex]
            ) as HTMLInputElement | null;
            if (radioInput) radioInput.checked = true;
          }
        }
      });
    },
    { threshold: 0.6, rootMargin: '-20% 0px -20% 0px' }
  );

  // Observar cada sección real
  sections.forEach((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) observer.observe(element);
  });
}
