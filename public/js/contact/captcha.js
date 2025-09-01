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
// Render retry state
let _renderAttempts = 0;
const _maxRenderAttempts = 4; // safe limit
let _checkTokenTimer = null;
const _renderBackoffBase = 300; // ms

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

  // If we received a valid token, clear retry state
  try {
    if (_lastToken) {
      _renderAttempts = 0;
      if (_checkTokenTimer) {
        globalThis.clearTimeout(_checkTokenTimer);
        _checkTokenTimer = null;
      }
    }
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

  // Attempt render with retries and backoff if token doesn't arrive
  const attemptRender = () => {
    if (!globalThis.turnstile?.render) {
      globalThis.setTimeout(attemptRender, 100);
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

      // increment attempts and schedule a token check
      _renderAttempts = (_renderAttempts || 0) + 1;
      if (_checkTokenTimer) {
        clearTimeout(_checkTokenTimer);
        _checkTokenTimer = null;
      }

      _checkTokenTimer = globalThis.setTimeout(() => {
        try {
          const token =
            _cfResponseInput?.value || globalThis.__captcha_token || '';
          if (!token) {
            if (_renderAttempts < _maxRenderAttempts) {
              const delay = _renderBackoffBase * Math.pow(2, _renderAttempts);
              // intermediate retry (silenced in console)
              globalThis.setTimeout(attemptRender, delay);
            } else {
              console.error('Captcha render retries exhausted');
              setCaptchaState(false, '');
            }
          }
        } catch (err) {
          console.debug('Error during captcha token check:', err);
        }
      }, 900);
    } catch (err) {
      console.debug('Error in renderCaptchaManually:', err);
    }
  };

  // reset counter on fresh call
  _renderAttempts = 0;
  attemptRender();
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
  // reset attempts and timers then try render
  try {
    _renderAttempts = 0;
    if (_checkTokenTimer) {
      globalThis.clearTimeout(_checkTokenTimer);
      _checkTokenTimer = null;
    }
  } catch {}
  globalThis.setTimeout(renderCaptchaManually, 150);
}
