// Utility que observa cambios de tema y despacha un evento para forzar
// el refresco del background. Exporta una función que instala los listeners
// y devuelve una función de limpieza.
export function initBackgroundRefresh() {
  if (typeof window === 'undefined') return () => {};

  let lastIsDark = document.documentElement.classList.contains('dark');

  const dispatchRefresh = () => {
    // dispatch con pequeño retraso para dejar que otras mutaciones terminen
    setTimeout(() => {
      const currentTheme = lastIsDark ? 'dark' : 'light';
      console.log('Background refresh dispatched for theme:', currentTheme); // Debug log
      window.dispatchEvent(
        new CustomEvent('background-refresh', {
          detail: { theme: currentTheme },
        })
      );
    }, 80);
  };

  const mo = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark !== lastIsDark) {
      console.log('Theme change detected:', isDark ? 'dark' : 'light'); // Debug log
      lastIsDark = isDark;
      dispatchRefresh();
    }
  });

  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Escuchar eventos de tema del ThemeHelper
  const onThemeChange = (e: CustomEvent) => {
    if (e.detail && e.detail.theme) {
      const isDark = e.detail.theme === 'dark';
      if (isDark !== lastIsDark) {
        console.log('ThemeHelper change detected:', e.detail.theme); // Debug log
        lastIsDark = isDark;
        dispatchRefresh();
      }
    }
  };

  const onThemeReady = (e: CustomEvent) => {
    if (e.detail && e.detail.theme) {
      const isDark = e.detail.theme === 'dark';
      console.log('ThemeHelper ready:', e.detail.theme); // Debug log
      lastIsDark = isDark;
      dispatchRefresh();
    }
  };

  window.addEventListener('theme:change', onThemeChange as EventListener);
  window.addEventListener('theme:ready', onThemeReady as EventListener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === 'color-theme') {
      const isDark = e.newValue === 'dark';
      if (isDark !== lastIsDark) {
        console.log(
          'Storage theme change detected:',
          isDark ? 'dark' : 'light'
        ); // Debug log
        lastIsDark = isDark;
        dispatchRefresh();
      }
    }
  };

  window.addEventListener('storage', onStorage);

  // También escuchar cambios directos en el atributo lang para cambios de tema
  const onLangChange = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark !== lastIsDark) {
      console.log('Lang change theme detected:', isDark ? 'dark' : 'light'); // Debug log
      lastIsDark = isDark;
      dispatchRefresh();
    }
  };

  window.addEventListener('langChange', onLangChange);

  return () => {
    mo.disconnect();
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('langChange', onLangChange);
    window.removeEventListener('theme:change', onThemeChange as EventListener);
    window.removeEventListener('theme:ready', onThemeReady as EventListener);
  };
}

export default initBackgroundRefresh;
