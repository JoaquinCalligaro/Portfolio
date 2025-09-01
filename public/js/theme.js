// Client-side theme helper
// Responsibilities:
// - provide get/set for theme in localStorage
// - apply/remove `dark` class on documentElement
// - emit `theme:change` CustomEvent with detail { theme }

(function (global) {
  if (!global) return;
  const KEY = 'color-theme';
  function safeGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (e) {
      console.debug('localStorage.get failed', e);
      return null;
    }
  }
  function safeSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (e) {
      console.debug('localStorage.set failed', e);
    }
  }

  function applyTheme(theme) {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // clear any inline temporary background set by initializer
      try {
        document.documentElement.style.backgroundColor = '';
        if (document.body) document.body.style.backgroundColor = '';
      } catch (e) {}
      try {
        const evt = new CustomEvent('theme:change', { detail: { theme } });
        global.dispatchEvent(evt);
      } catch (e) {
        console.debug('Failed to dispatch theme:change', e);
      }
    } catch (e) {
      console.debug('applyTheme error', e);
    }
  }

  function getPreferred() {
    const stored = safeGet(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    try {
      if (
        global.matchMedia &&
        global.matchMedia('(prefers-color-scheme: dark)').matches
      )
        return 'dark';
    } catch (e) {}
    return 'light';
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    safeSet(KEY, theme);
    applyTheme(theme);
  }

  function toggleTheme() {
    const cur = getPreferred();
    const next = cur === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  // Expose API
  global.ThemeHelper = {
    getPreferred,
    setTheme,
    toggleTheme,
    applyTheme,
  };
  // Apply current preference immediately so any temporary background is cleared
  try {
    const current = getPreferred();
    applyTheme(current);
  } catch (e) {
    console.debug('Failed to auto-apply theme', e);
  }
  // Notify that initial theme application has completed. Consumers can wait for this
  // event to avoid race conditions when mounting theme-dependent UI (e.g. canvas background).
  try {
    const readyEvt = new CustomEvent('theme:ready', {
      detail: { theme: getPreferred() },
    });
    global.dispatchEvent(readyEvt);
  } catch (e) {
    console.debug('Failed to dispatch theme:ready', e);
  }
})(window);
