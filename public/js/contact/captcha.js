/* eslint-env browser, es2021 */
/* eslint no-console: 0 */
/* eslint no-empty: 0 */
/* global CustomEvent, console */
/* Archivo cliente: se ejecuta en el navegador. Usamos globalThis para seguridad SSR.
  Las directivas ESLint permiten reconocer los globals del navegador. */

let _captchaOk = false;
let _cfResponseInput = null;
let _lastToken = '';
let _widgetId = null;
let _siteKey = null;

// Actualiza el estado del captcha y notifica con el evento 'captcha:change'
function setCaptchaState(ok, token) {
  _captchaOk = !!ok;
  _lastToken = token || '';
  try {
    if (_cfResponseInput) _cfResponseInput.value = token || '';
    const byName = globalThis.document?.querySelector(
      'input[name="cf-turnstile-response"]'
    );
    if (byName) byName.value = token || '';
  } catch {}

  try {
    globalThis.__captcha_token = _lastToken;
    globalThis.__captcha_ok = _captchaOk;
  } catch {}

  try {
    const evt = new CustomEvent('captcha:change', {
      detail: { ok: _captchaOk, token: _lastToken },
    });
    globalThis.dispatchEvent(evt);
  } catch {}

  console.log('Captcha state updated:', {
    ok: _captchaOk,
    hasToken: !!_lastToken,
  });
}

// Renderiza Turnstile programáticamente (mejor compatibilidad móvil)
function renderCaptchaManually() {
  const container = globalThis.document?.querySelector('.cf-turnstile');
  if (!container) return;

  _siteKey = container.getAttribute('data-sitekey') || _siteKey;
  if (!_siteKey) return;

  const tryRender = () => {
    if (!globalThis.turnstile?.render) {
      globalThis.setTimeout(tryRender, 100);
      return;
    }

    try {
      while (container.firstChild) container.removeChild(container.firstChild);
      container.style.display = container.style.display || 'block';

      const minimalOptions = {
        sitekey: _siteKey,
        callback: (token) => setCaptchaState(true, token),
        'expired-callback': () => setCaptchaState(false, ''),
        'error-callback': () => setCaptchaState(false, ''),
      };

      _widgetId = globalThis.turnstile.render(container, minimalOptions);
    } catch (err) {
      console.error('Error in renderCaptchaManually:', err);
    }
  };

  tryRender();
}

if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.document !== 'undefined'
) {
  try {
    _cfResponseInput = globalThis.document.getElementById(
      'cf-turnstile-response'
    );
    const container = globalThis.document.querySelector('.cf-turnstile');
    if (container) _siteKey = container.getAttribute('data-sitekey');
  } catch {
    _cfResponseInput = null;
  }

  if (globalThis.document.readyState === 'loading') {
    globalThis.document.addEventListener('DOMContentLoaded', () => {
      globalThis.setTimeout(renderCaptchaManually, 500);
    });
  } else {
    globalThis.setTimeout(renderCaptchaManually, 500);
  }
}

// API pública del helper
export function isCaptchaOk() {
  return _captchaOk;
}

export function getCaptchaToken() {
  try {
    return _cfResponseInput?.value || _lastToken || '';
  } catch {
    return _lastToken || '';
  }
}

export function resetCaptcha() {
  console.log('Resetting captcha');
  setCaptchaState(false, '');
  try {
    if (globalThis.turnstile?.reset) {
      if (_widgetId !== null) globalThis.turnstile.reset(_widgetId);
      else globalThis.turnstile.reset();
    }
  } catch {}
}

export function reloadCaptcha() {
  console.log('Reloading captcha');
  setCaptchaState(false, '');
  globalThis.setTimeout(renderCaptchaManually, 150);
}
