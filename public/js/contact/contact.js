/* eslint-env browser, es2021 */
/* eslint no-console: 0 */
/* eslint no-empty: 0 */
/* Archivo cliente: se ejecuta en el navegador. Usamos globalThis para seguridad SSR
  y las directivas ESLint habilitan los globals del navegador para evitar advertencias. */
/* global console, navigator, setTimeout, setInterval, clearInterval, MutationObserver, FormData, fetch, CustomEvent */
/* eslint no-unused-vars: 0 */
// Evita romper en SSR comprobando si document existe
if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.document !== 'undefined'
) {
  // import dinámico del helper de captcha (seguro para SSR)
  let captcha = null;
  try {
    captcha = await import('/js/contact/captcha.js');
  } catch {
    captcha = null;
  }

  const doc = globalThis.document;

  // Leer traducciones inyectadas en window.TRANSLATIONS
  const translations =
    globalThis.TRANSLATIONS && typeof globalThis.TRANSLATIONS === 'object'
      ? globalThis.TRANSLATIONS
      : {};

  // Obtener idioma actual
  const htmlLang =
    doc && doc.documentElement && doc.documentElement.lang
      ? String(doc.documentElement.lang)
      : 'ES';
  const lang = String(htmlLang).toUpperCase() === 'EN' ? 'EN' : 'ES';

  // Traducciones por defecto (fallback)
  const DEFAULT_TRANSLATIONS = {
    ES: {
      contact: {
        nameRequired: 'El nombre es requerido.',
        nameShort: 'El nombre es muy corto.',
        nameLong: 'El nombre es muy largo.',
        emailRequired: 'El email es requerido.',
        emailLong: 'El email es demasiado largo.',
        invalidEmail: 'Formato de email inválido.',
        messageRequired: 'El mensaje es requerido.',
        messageMinLength: 'El mensaje debe tener al menos 10 caracteres.',
        messageMaxLength: 'El mensaje excede la longitud máxima.',
        captchaRequired: 'Por favor completa el captcha antes de enviar.',
        captchaChecking: 'Verificando captcha...',
      },
    },
    EN: {
      contact: {
        nameRequired: 'Name is required.',
        nameShort: 'Name is too short.',
        nameLong: 'Name is too long.',
        emailRequired: 'Email is required.',
        emailLong: 'Email is too long.',
        invalidEmail: 'Invalid email format.',
        messageRequired: 'Message is required.',
        messageMinLength: 'The message must be at least 10 characters.',
        messageMaxLength: 'The message exceeds the maximum length.',
        captchaRequired: 'Please complete the captcha before submitting.',
        captchaChecking: 'Verifying captcha...',
      },
    },
  };

  function t(key) {
    try {
      const root = translations && translations[lang] ? translations[lang] : {};
      const found = String(key)
        .split('.')
        .reduce(
          (o, k) =>
            o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined,
          root
        );
      if (found) return found;

      const defRoot = DEFAULT_TRANSLATIONS[lang] || {};
      const defFound = String(key)
        .split('.')
        .reduce(
          (o, k) =>
            o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined,
          defRoot
        );
      return defFound || '';
    } catch {
      return '';
    }
  }

  // Modo demo frontend (omitir captcha en pruebas)
  const FRONTEND_ONLY = (() => {
    try {
      if (!doc) return false;
      const qs =
        typeof globalThis.location !== 'undefined' &&
        typeof globalThis.URL !== 'undefined'
          ? new globalThis.URL(globalThis.location.href).searchParams
          : null;
      const formAttr = (doc.getElementById('contact-form') || {}).dataset;
      const fromAttrFlag = formAttr && formAttr.frontendOnly === 'true';
      const qsFlag = qs && qs.get('mockContact') === '1';
      const lsFlag =
        globalThis.localStorage &&
        globalThis.localStorage.getItem('contact:mock') === '1';
      return Boolean(fromAttrFlag || qsFlag || lsFlag);
    } catch {
      return false;
    }
  })();

  const form = doc.getElementById('contact-form');
  const status = doc.getElementById('form-status');
  const submitBtn = doc.getElementById('submit-btn');
  const cfResponseInput = doc.getElementById('cf-turnstile-response');

  // Campos del formulario y nodos de validación
  const nameInput = doc.getElementById('name');
  const emailInput = doc.getElementById('email');
  const nameError = doc.getElementById('name-error');
  const emailError = doc.getElementById('email-error');
  const messageEditor = doc.getElementById('message-editor');
  const messageError = doc.getElementById('message-error');
  const honeypot = doc.getElementById('website');

  function setFieldError(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    try {
      const input =
        (el.id === 'name-error' && nameInput) ||
        (el.id === 'email-error' && emailInput) ||
        (el.id === 'message-error' && messageEditor) ||
        null;
      if (input) input.setAttribute('aria-invalid', !!msg);

      if (input && input.classList) {
        if (msg) {
          input.classList.add('border-red-500');
        } else {
          input.classList.remove('border-red-500');
        }
      }
    } catch {
      /* ignore */
    }
  }

  function validateName() {
    if (!nameInput) return true;
    const v = nameInput.value.trim();
    if (!v) {
      setFieldError(nameError, t('contact.nameRequired'));
      return false;
    }
    if (v.length < 2) {
      setFieldError(nameError, t('contact.nameShort'));
      return false;
    }
    if (v.length > 100) {
      setFieldError(nameError, t('contact.nameLong'));
      return false;
    }
    setFieldError(nameError, '');
    return true;
  }

  function validateEmail() {
    if (!emailInput) return true;
    const v = emailInput.value.trim();
    if (!v) {
      setFieldError(emailError, t('contact.emailRequired'));
      return false;
    }

    if (v.length > 254) {
      setFieldError(emailError, t('contact.emailLong'));
      return false;
    }

    try {
      if (
        typeof emailInput.checkValidity === 'function' &&
        !emailInput.checkValidity()
      ) {
        setFieldError(emailError, t('contact.invalidEmail'));
        return false;
      }
    } catch {
      // fallback to regex
    }

    const strictRe =
      /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/;
    if (!strictRe.test(v)) {
      setFieldError(emailError, t('contact.invalidEmail'));
      return false;
    }

    setFieldError(emailError, '');
    return true;
  }

  function validateMessage() {
    if (!messageEditor) return true;
    const v = (messageEditor.innerText || '').trim();
    if (!v) {
      setFieldError(messageError, t('contact.messageRequired'));
      return false;
    }
    if (v.length < 10) {
      setFieldError(messageError, t('contact.messageMinLength'));
      return false;
    }
    if (v.length > 5000) {
      setFieldError(messageError, t('contact.messageMaxLength'));
      return false;
    }
    setFieldError(messageError, '');
    return true;
  }

  function validateForm() {
    const ok = validateName() && validateEmail() && validateMessage();
    updateSubmitButtonState();
    return ok;
  }

  // Estado controlado del captcha
  let __captchaSolved = false;
  // Nuevo flag: solo se pone true dentro del callback oficial de Turnstile (éxito)
  let __captchaSolvedByCallback = false;

  function isCaptchaValid() {
    if (FRONTEND_ONLY) return true;
    const token =
      (cfResponseInput && cfResponseInput.value) ||
      globalThis.__captcha_token ||
      '';
    // Solo consideramos válido si el callback oficial se disparó en esta carga
    const valid = __captchaSolvedByCallback && token.length > 20;
    return valid;
  }

  // Registrar callbacks (sobrescriben anteriores si existían)
  globalThis.turnstileOnSuccess = (token) => {
    __captchaSolved = true; // legacy internal
    __captchaSolvedByCallback = true; // flag estricto
    if (cfResponseInput) cfResponseInput.value = token || '';
    globalThis.__captcha_token = token || '';
    updateSubmitButtonState();
  };
  globalThis.turnstileOnExpired = () => {
    __captchaSolved = false;
    __captchaSolvedByCallback = false;
    if (cfResponseInput) cfResponseInput.value = '';
    globalThis.__captcha_token = '';
    updateSubmitButtonState();
  };
  globalThis.turnstileOnError = () => {
    __captchaSolved = false;
    __captchaSolvedByCallback = false;
    if (cfResponseInput) cfResponseInput.value = '';
    globalThis.__captcha_token = '';
    updateSubmitButtonState();
  };

  // Función mejorada para actualizar el estado del botón submit
  function updateSubmitButtonState() {
    if (!submitBtn) return;

    const hasContent = hasContentInFields();
    const formValid = hasContent;
    const captchaValid = isCaptchaValid();
    const cooldownActive = getRemainingCooldown() > 0;

    // El botón solo se habilita si TODAS las condiciones se cumplen
    const shouldEnable = formValid && captchaValid && !cooldownActive;

    console.log('Submit button state check:', {
      hasContent,
      formValid,
      captchaValid,
      cooldownActive,
      shouldEnable,
      captchaSolvedFlag:
        typeof __captchaSolved !== 'undefined' ? __captchaSolved : 'n/a',
      captchaSolvedByCallback: __captchaSolvedByCallback,
    });

    // CRÍTICO: El botón debe estar deshabilitado si NO hay captcha válido
    if (!captchaValid && !FRONTEND_ONLY) {
      submitBtn.disabled = true;
      console.log('Button DISABLED - Captcha not valid');
    } else if (shouldEnable) {
      submitBtn.disabled = false;
      console.log('Button ENABLED - All conditions met');
    } else {
      submitBtn.disabled = true;
      console.log('Button DISABLED - Not all conditions met');
    }

    // En móviles, mostrar botón de verificación manual si hay contenido pero captcha no válido
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const forceButton = doc.getElementById('force-captcha-check');

    if (
      isMobile &&
      forceButton &&
      hasContent &&
      !captchaValid &&
      !FRONTEND_ONLY
    ) {
      // Verificar si realmente hay token pero el estado no se actualiza
      const token = cfResponseInput ? cfResponseInput.value : '';
      if (token && token.length > 5) {
        forceButton.style.display = 'inline-block';
      } else {
        forceButton.style.display = 'none';
      }
    } else if (forceButton) {
      forceButton.style.display = 'none';
    }
  }

  function hasContentInFields() {
    const n = nameInput && nameInput.value ? nameInput.value.trim() : '';
    const e = emailInput && emailInput.value ? emailInput.value.trim() : '';
    const m =
      messageEditor && (messageEditor.innerText || messageEditor.textContent)
        ? (messageEditor.innerText || messageEditor.textContent).trim()
        : '';
    return n.length > 0 && e.length > 0 && m.length > 0;
  }

  // Registrar listeners de eventos
  if (nameInput) nameInput.addEventListener('input', validateForm);
  if (emailInput) emailInput.addEventListener('input', validateForm);
  if (messageEditor) {
    messageEditor.addEventListener('input', validateForm);
    messageEditor.addEventListener('blur', validateForm);
  }

  // Estado inicial: botón deshabilitado hasta completar captcha y limpiar tokens previos
  if (submitBtn) submitBtn.disabled = true;
  if (cfResponseInput) cfResponseInput.value = '';
  try {
    globalThis.__captcha_token = '';
    globalThis.__captcha_ok = false;
  } catch {}

  // Debug inicial
  console.log('Contact form initialized:', {
    submitBtn: !!submitBtn,
    cfResponseInput: !!cfResponseInput,
    captchaModule: !!captcha,
    hasContentFields: hasContentInFields(),
  });

  updateSubmitButtonState();

  // Inicializar editor enriquecido (simplificado)
  const editor = messageEditor;
  const hiddenMessage = doc.getElementById('message');

  function exec(cmd, value = null) {
    if (doc.execCommand) doc.execCommand(cmd, false, value);
    if (editor) editor.focus();
  }

  const cmdButtons = doc.querySelectorAll
    ? doc.querySelectorAll('[data-cmd]')
    : [];
  Array.from(cmdButtons || []).forEach((btn) => {
    btn.addEventListener('click', () => exec(btn.dataset.cmd));
  });

  const fontFamily = doc.getElementById('font-family');
  const fontSize = doc.getElementById('font-size');

  if (fontFamily)
    fontFamily.addEventListener('change', (e) =>
      exec('fontName', e.target.value)
    );
  if (fontSize)
    fontSize.addEventListener('change', (e) =>
      exec('fontSize', e.target.value)
    );

  function syncEditor() {
    if (hiddenMessage) hiddenMessage.value = editor ? editor.innerHTML : '';
  }

  // Registro de tiempo (para detección de envíos muy rápidos)
  const startTime = Date.now();
  const timeInput = doc.getElementById('time_spent');
  const formTokenInput = doc.getElementById('form_token');

  // Generación de token del formulario
  let formToken = null;
  function generateToken() {
    try {
      formToken =
        globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : String(Date.now() + Math.random()).replace('.', '');
      if (formTokenInput) formTokenInput.value = formToken;
    } catch {
      formToken = String(Date.now() + Math.random()).replace('.', '');
      if (formTokenInput) formTokenInput.value = formToken;
    }
  }
  generateToken();

  // Forzar re-evaluación del captcha en móviles
  function forceCheckCaptcha() {
    console.log('Forcing captcha recheck...');

    // Buscar token en todos los lugares posibles
    let foundToken = '';

    // 1. Input hidden principal
    if (cfResponseInput && cfResponseInput.value) {
      foundToken = cfResponseInput.value;
      console.log('Found token in main input:', foundToken.length, 'chars');
    }

    // 2. Variables globales
    if (!foundToken && globalThis.__captcha_token) {
      foundToken = globalThis.__captcha_token;
      console.log(
        'Found token in global variable:',
        foundToken.length,
        'chars'
      );
    }

    // 3. Todos los inputs relacionados con captcha/turnstile
    if (!foundToken) {
      const allInputs = doc.querySelectorAll(
        'input[name*="turnstile"], input[name*="captcha"], input[id*="turnstile"], input[id*="captcha"], input[type="hidden"]'
      );
      for (const input of allInputs) {
        const inputValue = input.value || '';
        if (inputValue && inputValue.length > 20) {
          // Tokens de Turnstile son típicamente >40 chars
          foundToken = inputValue;
          console.log(
            'Found token in input:',
            input.name || input.id,
            'Length:',
            foundToken.length
          );
          // Sincronizar con el input principal
          if (cfResponseInput) {
            cfResponseInput.value = foundToken;
          }
          break;
        }
      }
    }

    // 4. Si encontramos token, actualizar variables globales
    if (foundToken && foundToken.length > 20) {
      globalThis.__captcha_token = foundToken;
      globalThis.__captcha_ok = true;
      // Si encontramos un token válido manualmente, marcar como resuelto
      __captchaSolvedByCallback = true;
      console.log(
        'Token found and synchronized:',
        foundToken.substring(0, 10) + '...'
      );
    }
    setTimeout(() => {
      updateSubmitButtonState();
    }, 100);

    // Segundo chequeo más tarde por si hay delay
    setTimeout(() => {
      updateSubmitButtonState();
    }, 500);
  }

  // Configurar manejo de eventos del captcha (mejoras móviles)
  if (captcha) {
    console.log('Captcha module loaded successfully');
  } else {
    console.log('Captcha module not loaded, setting up fallback callbacks');
    // Fallback callbacks mejorados para móviles
    globalThis.turnstileOnSuccess = function (token) {
      console.log(
        'Fallback turnstile success:',
        !!token,
        'Token length:',
        token ? token.length : 0
      );
      try {
        if (token && token.length > 10) {
          // Sincronizar en todos los lugares
          if (cfResponseInput) cfResponseInput.value = token;
          globalThis.__captcha_token = token;
          globalThis.__captcha_ok = true;
          __captchaSolved = true; // mantener legacy
          __captchaSolvedByCallback = true; // estricto

          console.log('Token successfully stored in all locations');

          // Forzar múltiples actualizaciones
          updateSubmitButtonState();
          forceCheckCaptcha();

          // Disparar evento personalizado para mayor compatibilidad
          if (typeof globalThis.dispatchEvent === 'function') {
            const evt = new CustomEvent('captcha:change', {
              detail: { ok: true, token: token },
            });
            globalThis.dispatchEvent(evt);
          }
        } else {
          console.warn(
            'Turnstile success callback called but no valid token provided'
          );
        }
      } catch (error) {
        console.error('Error in turnstile success callback:', error);
      }
    };

    globalThis.turnstileOnExpired = function () {
      console.log('Fallback turnstile expired');
      try {
        if (cfResponseInput) cfResponseInput.value = '';
        globalThis.__captcha_token = '';
        globalThis.__captcha_ok = false;
        __captchaSolved = false;
        __captchaSolvedByCallback = false;
        if (submitBtn) submitBtn.disabled = true;
        updateSubmitButtonState();
      } catch (error) {
        console.error('Error in turnstile expired callback:', error);
      }
    };

    globalThis.turnstileOnError = function (error) {
      console.log('Fallback turnstile error:', error);
      try {
        if (cfResponseInput) cfResponseInput.value = '';
        globalThis.__captcha_token = '';
        globalThis.__captcha_ok = false;
        __captchaSolved = false;
        __captchaSolvedByCallback = false;
        if (submitBtn) submitBtn.disabled = true;
        updateSubmitButtonState();
      } catch (err) {
        console.error('Error in turnstile error callback:', err);
      }
    };
  }

  // Listen to captcha change events y agregar observador de DOM para móviles
  try {
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('captcha:change', (e) => {
        console.log('Captcha change event received:', e.detail);
        try {
          const token = e.detail.token || '';
          if (cfResponseInput) cfResponseInput.value = token;
          // NO marcar solved aquí para evitar habilitar antes de interacción real
          updateSubmitButtonState();

          // En móviles, forzar re-evaluación adicional
          forceCheckCaptcha();
        } catch (error) {
          console.error('Error handling captcha change:', error);
        }
      });
    }

    // Observador para cambios en el contenedor del captcha (específico para móviles)
    const captchaContainer = doc.querySelector('.cf-turnstile');
    if (captchaContainer && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        let shouldRecheck = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            console.log('Captcha DOM changed:', mutation.type);
            shouldRecheck = true;
          }
        });

        if (shouldRecheck) {
          setTimeout(() => {
            forceCheckCaptcha();
          }, 200);
        }
      });

      observer.observe(captchaContainer, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  } catch (error) {
    console.error('Error setting up captcha event listener:', error);
  }

  // Invalidar token al cambiar de pestaña
  if (doc && typeof doc.addEventListener === 'function') {
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) {
        formToken = null;
        if (formTokenInput) formTokenInput.value = '';
      } else {
        generateToken();
      }
    });
  }

  // Límite de envío: 5 minutos
  const RATE_KEY = 'contact:lastSend';
  const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

  function getRemainingCooldown() {
    try {
      const ls = globalThis.localStorage;
      const last = Number(ls ? ls.getItem(RATE_KEY) || 0 : 0);
      const now = Date.now();
      const elapsed = now - last;
      const remaining = RATE_LIMIT_MS - elapsed;
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }

  function formatCooldownTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }

  // rate-limit helper inlined where needed; removed unused wrapper to satisfy linter

  function markSend() {
    try {
      const ls = globalThis.localStorage;
      if (ls) ls.setItem(RATE_KEY, String(Date.now()));
      startCooldownTimer();
    } catch {
      /* ignore */
    }
  }

  // Temporizador visual del cooldown
  let cooldownInterval = null;
  const cooldownDisplay = doc.getElementById('cooldown-display');

  function updateCooldownDisplay() {
    const remaining = getRemainingCooldown();
    if (remaining > 0 && cooldownDisplay) {
      const timeStr = formatCooldownTime(remaining);
      cooldownDisplay.textContent = t('contact.cooldownWait').replace(
        '${timeStr}',
        timeStr
      );
      cooldownDisplay.style.display = 'block';

      // Deshabilitar el botón durante el cooldown
      if (submitBtn) submitBtn.disabled = true;
    } else {
      if (cooldownDisplay) {
        cooldownDisplay.style.display = 'none';
        cooldownDisplay.textContent = '';
      }
      // Re-evaluar el estado del botón
      updateSubmitButtonState();
    }
  }

  function startCooldownTimer() {
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
    }

    updateCooldownDisplay();

    cooldownInterval = setInterval(() => {
      updateCooldownDisplay();

      // Si ya no hay cooldown, limpiar el interval
      if (getRemainingCooldown() === 0) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    }, 1000);
  }

  // Chequeo periódico para móviles - detectar captcha completado no detectado
  let mobileCheckInterval = null;
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Chequeo más agresivo para todos los dispositivos si hay problemas de sincronización
  console.log('Starting enhanced captcha monitoring...');
  mobileCheckInterval = setInterval(() => {
    // Solo chequear si hay contenido en los campos pero el botón está deshabilitado
    if (
      hasContentInFields() &&
      submitBtn &&
      submitBtn.disabled &&
      !getRemainingCooldown()
    ) {
      // Buscar indicadores visuales de éxito
      const captchaWidget = doc.querySelector('.cf-turnstile');
      let hasVisualSuccess = false;

      if (captchaWidget) {
        const textContent = captchaWidget.textContent || '';
        const hasSuccessText = textContent.toLowerCase().includes('success');
        const hasCheckmark = captchaWidget.querySelector(
          'svg[data-icon="check"], .checkmark, [aria-label*="success" i]'
        );
        hasVisualSuccess = hasSuccessText || !!hasCheckmark;
      }

      // Si hay éxito visual o token, forzar recheck
      const token = cfResponseInput ? cfResponseInput.value : '';
      if ((token && token.length > 10) || hasVisualSuccess) {
        console.log(
          'Detected captcha completion - Token:',
          !!token,
          'Visual success:',
          hasVisualSuccess
        );
        forceCheckCaptcha();
      }
    }
  }, 1000); // Chequear cada segundo (más frecuente)

  // Limpiar interval cuando se complete el captcha exitosamente
  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('captcha:change', (e) => {
      if (e.detail.ok && mobileCheckInterval) {
        clearInterval(mobileCheckInterval);
        mobileCheckInterval = null;
        console.log('Enhanced captcha monitoring stopped - captcha completed');
      }
    });
  }

  // Verificar cooldown al cargar la página
  if (getRemainingCooldown() > 0) {
    startCooldownTimer();
  }

  // Listener del botón de verificación manual (móviles)
  const forceCheckButton = doc.getElementById('force-captcha-check');
  if (forceCheckButton) {
    forceCheckButton.addEventListener('click', () => {
      console.log('Manual captcha verification requested');
      forceCheckCaptcha();

      // Feedback visual
      const originalText = forceCheckButton.textContent;
      forceCheckButton.textContent = '🔄 Verificando...';
      forceCheckButton.disabled = true;

      setTimeout(() => {
        forceCheckButton.textContent = originalText;
        forceCheckButton.disabled = false;

        // Si aún hay problemas, mostrar mensaje
        if (!isCaptchaValid()) {
          const token = cfResponseInput ? cfResponseInput.value : '';
          if (token && token.length > 5) {
            if (status) {
              status.textContent = t('contact.captchaNotDetected');
              status.classList.add('text-yellow-600');
            }
          }
        }
      }, 1000);
    });
  }

  // Manejador principal de envío de formulario
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submission started');

      // Clear any previous status messages
      if (status) {
        status.textContent = '';
        status.className = 'text-sm';
      }

      // Honeypot check
      if (honeypot && (honeypot.value || '').trim()) {
        if (status) {
          status.textContent =
            t('contact.spamDetected') || 'Envío detectado como spam.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // Time check
      const elapsed = Date.now() - startTime;
      if (timeInput) timeInput.value = String(elapsed);
      if (elapsed < 2500) {
        if (status) {
          status.textContent =
            t('contact.tooFastStatus') ||
            'Envío demasiado rápido (posible bot).';
          status.classList.add('text-red-600');
        }
        return;
      }

      // Rate limit check - 5 minutos
      const remainingCooldown = getRemainingCooldown();
      if (remainingCooldown > 0) {
        const timeStr = formatCooldownTime(remainingCooldown);
        if (status) {
          status.textContent =
            lang === 'EN'
              ? `Please wait ${timeStr} before sending another message.`
              : `Espera ${timeStr} antes de enviar otro mensaje.`;
          status.classList.add('text-red-600');
        }
        return;
      }

      // Form token check
      if (!formToken) {
        if (status) {
          status.textContent =
            t('contact.invalidForm') ||
            'Formulario inválido. Refresca la página e intenta de nuevo.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // Form validation
      if (!validateForm()) {
        if (status) {
          status.textContent = 'Por favor corrige los errores antes de enviar.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // Captcha validation - MEJORADO
      if (!FRONTEND_ONLY) {
        const captchaValid = isCaptchaValid();
        console.log('Final captcha validation:', captchaValid);

        if (!captchaValid) {
          if (status) {
            status.textContent = t('contact.captchaRequired');
            status.classList.add('text-red-600');
          }

          // Intentar recargar el captcha una vez
          try {
            if (captcha && typeof captcha.reloadCaptcha === 'function') {
              console.log('Attempting to reload captcha');
              captcha.reloadCaptcha();
            }
          } catch (error) {
            console.error('Error reloading captcha:', error);
          }

          return;
        }
      }

      // Proceed with form submission
      console.log('All validations passed, submitting form');
      await submitForm();
    });
  }

  async function submitForm() {
    if (submitBtn) submitBtn.disabled = true;

    // Guardar contenido original del botón
    const originalBtnChildren = submitBtn
      ? Array.from(submitBtn.childNodes).map((n) => n.cloneNode(true))
      : null;

    if (submitBtn)
      submitBtn.textContent = t('contact.sending') || 'Enviando...';

    try {
      syncEditor();

      const sanitize = (s) =>
        String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (nameInput && nameInput.value) {
        nameInput.value = sanitize(nameInput.value);
      }
      if (hiddenMessage && hiddenMessage.value) {
        hiddenMessage.value = sanitize(hiddenMessage.value);
      }

      let res = null;
      let json = null;

      if (FRONTEND_ONLY) {
        // Envío simulado en modo demo
        await new Promise((r) => setTimeout(r, 700 + Math.random() * 800));
        res = { ok: true };
        json = { ok: true };
      } else {
        const fd = new FormData(form);
        res = await fetch(form.action, {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json' },
        });

        try {
          json = await res.json();
        } catch {
          const txt = await res.text().catch(() => '');
          json = { ok: res.ok, text: txt };
        }
      }

      const success = res && res.ok && json && json.ok !== false;

      if (success) {
        if (status) {
          status.textContent = t('contact.sentSuccess');
          status.classList.add('text-green-600');
          status.classList.remove('text-red-600');
        }

        form.reset();

        // Reiniciar captcha y estados
        try {
          if (captcha && typeof captcha.resetCaptcha === 'function') {
            captcha.resetCaptcha();
          }
          // Limpiar input de captcha
          if (cfResponseInput) cfResponseInput.value = '';
          // Limpiar variables globales
          if (globalThis.__captcha_token) globalThis.__captcha_token = '';
          if (globalThis.__captcha_ok) globalThis.__captcha_ok = false;
        } catch (error) {
          console.error('Error resetting captcha:', error);
        }

        markSend();

        // Regenerar form token para próximo envío
        generateToken();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);

      if (status) {
        status.textContent = 'Ocurrió un error al enviar. Intenta de nuevo.';
        status.classList.add('text-red-600');
        status.classList.remove('text-green-600');
      }
    } finally {
      // Restaurar botón
      if (submitBtn) {
        submitBtn.disabled = false;
        try {
          if (originalBtnChildren && Array.isArray(originalBtnChildren)) {
            submitBtn.replaceChildren(
              ...originalBtnChildren.map((n) => n.cloneNode(true))
            );
          } else {
            submitBtn.textContent = 'Enviar';
          }
        } catch {
          submitBtn.textContent = 'Enviar';
        }
      }

      // Update button state based on current form state
      setTimeout(() => {
        updateSubmitButtonState();
      }, 100);

      // Additional check for mobile devices
      if (isMobileDevice) {
        setTimeout(() => {
          updateSubmitButtonState();
        }, 500);
      }
    }
  }
}
