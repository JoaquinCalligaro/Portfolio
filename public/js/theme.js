/* eslint-env browser */
/* global window, document, CustomEvent, console */
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
    } catch (err) {
      console.debug('localStorage.get failed', err);
      return null;
    }
  }
  function safeSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (err) {
      console.debug('localStorage.set failed', err);
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

  function getPreferred() {
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
  } catch (err) {
    console.debug('Failed to auto-apply theme', err);
  }
  // Notify that initial theme application has completed. Consumers can wait for this
  // event to avoid race conditions when mounting theme-dependent UI (e.g. canvas background).
  try {
    const readyEvt = new CustomEvent('theme:ready', {
      detail: { theme: getPreferred() },
    });
    global.dispatchEvent(readyEvt);
  } catch (err) {
    console.debug('Failed to dispatch theme:ready', err);
  }
})(window);
