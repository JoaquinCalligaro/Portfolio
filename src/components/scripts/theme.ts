/* eslint-env browser */
/* global window, document, CustomEvent, console */
// Responsabilidades:
// - get/set del tema en localStorage
// - aplicar/remover la clase `dark` en documentElement
// - emitir `theme:change` con detail { theme }

type Theme = 'dark' | 'light';

const KEY = 'color-theme';

const global: Window | undefined =
  typeof window !== 'undefined' ? window : undefined;

function safeGet(key: string): string | null {
  try {
    return global.localStorage.getItem(key);
  } catch (err) {
    console.debug('localStorage.get failed', err);
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    global.localStorage.setItem(key, value);
  } catch (err) {
    console.debug('localStorage.set failed', err);
  }
}

function applyTheme(theme: Theme) {
  try {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // limpiar cualquier fondo temporal en línea
    try {
      document.documentElement.style.backgroundColor = '';
      if (document.body) document.body.style.backgroundColor = '';
    } catch (err) {
      console.debug('clear temporary background failed', err);
    }
    try {
      const evt = new CustomEvent('theme:change', { detail: { theme } });
      global.dispatchEvent(evt);
    } catch (err) {
      console.debug('Failed to dispatch theme:change', err);
    }
  } catch (err) {
    console.debug('applyTheme error', err);
  }
}

function getPreferred(): Theme {
  const stored = safeGet(KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  try {
    if (
      global.matchMedia &&
      global.matchMedia('(prefers-color-scheme: dark)').matches
    )
      return 'dark';
  } catch (err) {
    console.debug('matchMedia check failed', err);
  }
  return 'light';
}

function setTheme(theme: Theme) {
  if (theme !== 'dark' && theme !== 'light') return;
  safeSet(KEY, theme);
  applyTheme(theme);
}

function toggleTheme(): Theme {
  const cur = getPreferred();
  const next: Theme = cur === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export const ThemeHelper = {
  getPreferred,
  setTheme,
  toggleTheme,
  applyTheme,
};

// Exponer globalmente para compatibilidad antigua
if (global) {
  try {
    if (global)
      (global as unknown as { ThemeHelper?: typeof ThemeHelper }).ThemeHelper =
        ThemeHelper;
  } catch (err) {
    console.debug('Failed to attach ThemeHelper to window', err);
  }
}

// Aplicar la preferencia actual para limpiar fondos temporales
try {
  const current = getPreferred();
  applyTheme(current);
} catch (err) {
  console.debug('Failed to auto-apply theme', err);
}

// Notificar que la aplicación inicial del tema terminó. Útil para evitar condiciones de carrera.
try {
  const readyEvt = new CustomEvent('theme:ready', {
    detail: { theme: getPreferred() },
  });
  if (global) global.dispatchEvent(readyEvt);
} catch (err) {
  console.debug('Failed to dispatch theme:ready', err);
}

export default ThemeHelper;
