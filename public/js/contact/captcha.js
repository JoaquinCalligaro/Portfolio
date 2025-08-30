// Captcha helper for Turnstile
// Exposes: isCaptchaOk(), getCaptchaToken(), resetCaptcha(), (turnstile callbacks attached globally)

let _captchaOk = false;
let _cfResponseInput = null;

function setCaptchaState(ok, token) {
  _captchaOk = !!ok;
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
    return _cfResponseInput ? _cfResponseInput.value : '';
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
