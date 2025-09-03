// src/scripts/navbar/glassNavigation.ts

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
      const target = label.getAttribute('data-target');
      if (target) {
        document.querySelector(target)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // Actualizar sección activa según scroll
  const sections = ['#tech-stack', '#projects', '#about', '#contact'];
  const ids = ['glass-tech', 'glass-projects', 'glass-about', 'glass-contact'];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionIndex = sections.findIndex(
            (s) => s === `#${entry.target.id}`
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

  // Observar secciones
  sections.forEach((sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) observer.observe(element);
  });
}
