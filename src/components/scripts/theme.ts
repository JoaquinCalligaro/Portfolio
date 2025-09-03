// src/scripts/theme.ts

type Theme = 'light' | 'dark';

/**
 * Aplica un tema en el documento y actualiza íconos + localStorage.
 */
function setTheme(theme: Theme) {
  const html = document.documentElement;
  const moon = document.getElementById('theme-moon-icon');
  const sun = document.getElementById('theme-sun-icon');

  if (theme === 'dark') {
    html.classList.add('dark');
    localStorage.setItem('color-theme', 'dark');

    // Mostrar luna, ocultar sol
    moon?.classList.remove('hidden');
    sun?.classList.add('hidden');
  } else {
    html.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');

    // Mostrar sol, ocultar luna
    sun?.classList.remove('hidden');
    moon?.classList.add('hidden');
  }
}

/**
 * Cambia al tema opuesto.
 */
function toggleTheme() {
  const current = (localStorage.getItem('color-theme') as Theme) || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

/**
 * Inicializa el tema al cargar la página.
 */
function initTheme() {
  const stored = localStorage.getItem('color-theme') as Theme | null;
  const prefersDark = window.matchMedia?.(
    '(prefers-color-scheme: dark)'
  ).matches;

  if (stored === 'dark' || (!stored && prefersDark)) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

export const ThemeHelper = {
  setTheme,
  toggleTheme,
  initTheme,
};
