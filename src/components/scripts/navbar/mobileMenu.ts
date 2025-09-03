// src/scripts/navbar/mobileMenu.ts

/**
 * Inicializa el menú móvil de la navbar.
 * Se encarga de:
 *  - Abrir/cerrar el menú con el botón hamburguesa
 *  - Alternar los íconos (☰ ↔ ✖)
 *  - Ajustar el padding del body al abrir/cerrar
 *  - Cerrar el menú con Escape, click fuera o click en un link
 *  - Smooth scroll al hacer click en un link
 */
export function initMobileMenu() {
  const navbar = document.getElementById('navbar');
  const navbarToggle = document.getElementById('navbar-toggle');
  const navbarXIcon = document.getElementById('navbar-x-icon');
  const navbarMenuIcon = document.getElementById('navbar-menu-icon');
  const navbarLinks =
    document.querySelectorAll<HTMLAnchorElement>('#navbar-links a');

  if (!navbar || !navbarToggle || !navbarXIcon || !navbarMenuIcon) return;

  // --- Función para alternar el menú ---
  function toggleMobileMenu() {
    const isHidden = navbar.classList.contains('hidden');

    // Alternar iconos
    navbarXIcon.classList.toggle('hidden');
    navbarMenuIcon.classList.toggle('hidden');

    if (isHidden) {
      // Abrir menú
      navbar.classList.remove('hidden');
      setTimeout(() => navbar.classList.remove('-translate-y-[200%]'), 10);
      document.body.style.paddingTop = '100px';
    } else {
      // Cerrar menú
      navbar.classList.add('-translate-y-[200%]');
      setTimeout(() => navbar.classList.add('hidden'), 260);
      document.body.style.paddingTop = '20px';
    }
  }

  // --- Listeners ---
  // Click en el botón hamburguesa
  navbarToggle.addEventListener('click', toggleMobileMenu);

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !navbar.classList.contains('hidden')) {
      toggleMobileMenu();
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;
    const isClickInside =
      navbar.contains(target) || navbarToggle.contains(target);

    if (!isClickInside && !navbar.classList.contains('hidden')) {
      toggleMobileMenu();
    }
  });

  // Cerrar al hacer click en un link del menú
  navbarLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');

      if (targetId?.startsWith('#')) {
        // Smooth scroll
        document.querySelector(targetId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        // Cerrar menú
        if (!navbar.classList.contains('hidden')) {
          toggleMobileMenu();
        }
      }
    });
  });
}
