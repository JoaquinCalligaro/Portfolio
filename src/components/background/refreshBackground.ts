// Utility que observa cambios de tema y despacha un evento para forzar
// el refresco del background. Exporta una función que instala los listeners
// y devuelve una función de limpieza.
export function initBackgroundRefresh() {
  if (typeof window === 'undefined') return () => {};
  let lastIsDark = document.documentElement.classList.contains('dark');

  const dispatchRefresh = () => {
    // dispatch con pequeño retraso para dejar que otras mutaciones terminen
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('background-refresh', {
          detail: { theme: lastIsDark ? 'dark' : 'light' },
        })
      );
    }, 80);
  };

  const mo = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark !== lastIsDark) {
      lastIsDark = isDark;
      dispatchRefresh();
    }
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const onStorage = (e: StorageEvent) => {
    if (e.key === 'color-theme') {
      const isDark = e.newValue === 'dark';
      if (isDark !== lastIsDark) {
        lastIsDark = isDark;
        dispatchRefresh();
      }
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    mo.disconnect();
    window.removeEventListener('storage', onStorage);
  };
}

export default initBackgroundRefresh;
