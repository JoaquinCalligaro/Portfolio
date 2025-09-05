// Manejo del tema claro/oscuro del sitio web
type Theme = 'light' | 'dark';

/**
 * Aplica un tema específico y actualiza la UI
 */
function setTheme(theme: Theme) {
  const html = document.documentElement;
  const moon = document.getElementById('theme-moon-icon');
  const sun = document.getElementById('theme-sun-icon');

  if (theme === 'dark') {
    html.classList.add('dark');
    localStorage.setItem('color-theme', 'dark');

    // Actualiza iconos: mostrar luna, ocultar sol
    moon?.classList.remove('hidden');
    sun?.classList.add('hidden');
  } else {
    html.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');

    // Actualiza iconos: mostrar sol, ocultar luna
    sun?.classList.remove('hidden');
    moon?.classList.add('hidden');
  }
}

/**
 * Alterna entre tema claro y oscuro
 */
function toggleTheme() {
  const current = (localStorage.getItem('color-theme') as Theme) || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

/**
 * Inicializa el tema basado en preferencias guardadas o del sistema
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

// Exporta todas las funciones del tema
export const ThemeHelper = {
  setTheme,
  toggleTheme,
  initTheme,
};
