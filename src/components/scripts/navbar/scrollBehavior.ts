// src/scripts/navbar/scrollBehavior.ts

/**
 * Oculta o muestra la navbar al hacer scroll.
 * También se asegura de cerrar el menú móvil si está abierto.
 */
export function initScrollBehavior() {
  const navbar = document.getElementById('navbar');
  const navbarHeader = document.getElementById('navbar-header');
  const navbarXIcon = document.getElementById('navbar-x-icon');
  const navbarMenuIcon = document.getElementById('navbar-menu-icon');

  if (!navbar || !navbarHeader) return;

  let lastScrollTop = 0;

  window.addEventListener('scroll', () => {
    const currentScrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    // Ocultar navbar al hacer scroll hacia abajo
    if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
      navbarHeader.classList.add('-translate-y-full');

      // Cerrar menú móvil si está abierto
      if (!navbar.classList.contains('hidden')) {
        navbarXIcon?.classList.add('hidden');
        navbarMenuIcon?.classList.remove('hidden');
        navbar.classList.add('hidden', '-translate-y-[200%]');
        document.body.style.paddingTop = '80px';
      }
    }
    // Mostrar navbar al hacer scroll hacia arriba
    else if (currentScrollTop < lastScrollTop) {
      navbarHeader.classList.remove('-translate-y-full');
    }

    lastScrollTop = Math.max(currentScrollTop, 0);
  });
}
