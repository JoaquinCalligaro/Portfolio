// Captcha helper for Turnstile
// Exposes: isCaptchaOk(), getCaptchaToken(), resetCaptcha(), (turnstile callbacks attached globally)

let _captchaOk = false;
let _cfResponseInput = null;
let _lastToken = '';

function setCaptchaState(ok, token) {
  _captchaOk = !!ok;
  // keep the last token in memory so callers can retrieve it even if the
  // hidden input was not present at module init time.
  try {
    _lastToken = token || '';
  } catch {
    _lastToken = '';
  }
  try {
    if (_cfResponseInput) _cfResponseInput.value = token || '';
  } catch {
    /* ignore */
  }
  try {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.dispatchEvent === 'function' &&
      typeof globalThis.CustomEvent === 'function'
    ) {
      globalThis.dispatchEvent(
        new globalThis.CustomEvent('captcha:change', {
          detail: { ok: _captchaOk, token },
        })
      );
    }
  } catch {
    /* ignore */
  }
}

if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.document !== 'undefined'
) {
  try {
    _cfResponseInput = globalThis.document.getElementById(
      'cf-turnstile-response'
    );
  } catch {
    _cfResponseInput = null;
  }

  // Attach the callbacks Turnstile will call
  globalThis.turnstileOnSuccess = function (token) {
    setCaptchaState(true, token);
  };
  globalThis.turnstileOnExpired = function () {
    setCaptchaState(false, '');
  };
}

export function isCaptchaOk() {
  return _captchaOk;
}

export function getCaptchaToken() {
  try {
    // Prefer the hidden input value if present, otherwise return the last
    // token the module received from the Turnstile callback.
    return _cfResponseInput ? _cfResponseInput.value : _lastToken || '';
  } catch {
    return '';
  }
}

export function resetCaptcha() {
  setCaptchaState(false, '');
  try {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.turnstile &&
      typeof globalThis.turnstile.reset === 'function'
    ) {
      try {
        globalThis.turnstile.reset();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

// Attempt to reload/regenerate the Turnstile widget.
// This tries several strategies in order:
// 1. Call turnstile.reset() if available (soft reset).
// 2. Call turnstile.render() to re-render the widget into the existing container.
// 3. As a last resort, replace the container DOM and call render on the new node.
export function reloadCaptcha() {
  try {
    if (typeof globalThis === 'undefined') return;
    // prefer soft reset
    if (
      globalThis.turnstile &&
      typeof globalThis.turnstile.reset === 'function'
    ) {
      try {
        globalThis.turnstile.reset();
        return;
      } catch {
        /* ignore and try render */
      }
    }

    // try a full render into the existing container
    if (
      globalThis.turnstile &&
      typeof globalThis.turnstile.render === 'function' &&
      globalThis.document &&
      typeof globalThis.document.querySelector === 'function'
    ) {
      try {
        const container = globalThis.document.querySelector('.cf-turnstile');
        if (!container) return;
        const sitekey = container.getAttribute('data-sitekey') || '';
        // remove previous children to ensure a clean render
        try {
          while (container.firstChild)
            container.removeChild(container.firstChild);
        } catch {
          /* ignore */
        }
        // prefer passing callback functions if available
        const opts = { sitekey };
        if (typeof globalThis.turnstileOnSuccess === 'function')
          opts.callback = globalThis.turnstileOnSuccess;
        if (typeof globalThis.turnstileOnExpired === 'function')
          opts['expired-callback'] = globalThis.turnstileOnExpired;
        try {
          globalThis.turnstile.render(container, opts);
        } catch {
          // some versions accept (container, sitekey) signature
          try {
            globalThis.turnstile.render(container, sitekey);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}
