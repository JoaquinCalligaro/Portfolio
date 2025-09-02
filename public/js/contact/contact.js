/* eslint-env browser, es2021 */
/* eslint no-console: 0 */
/* eslint no-empty: 0 */
/* Archivo cliente: se ejecuta en el navegador. Usamos globalThis para seguridad SSR
  y las directivas ESLint habilitan los globals del navegador para evitar advertencias. */
/* global console, navigator, setTimeout, setInterval, clearInterval, MutationObserver, FormData, fetch */
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

  // Función mejorada para verificar el estado del captcha - Compatible con móviles
  function isCaptchaValid() {
    if (FRONTEND_ONLY) return true; // Skip captcha in demo mode

    try {
      let token = '';
      let isOk = false;

      // Verificar usando el módulo captcha si está disponible
      if (captcha && typeof captcha.isCaptchaOk === 'function') {
        isOk = captcha.isCaptchaOk();
        token = captcha.getCaptchaToken();
      }

      // Fallback: verificar directamente el input hidden
      if (!token && cfResponseInput) {
        token = cfResponseInput.value || '';
      }

      // Fallback: verificar estados globales
      if (!token && globalThis.__captcha_token) {
        token = globalThis.__captcha_token;
        isOk = globalThis.__captcha_ok;
      }

      // En móviles, solo verificar que el token existe y no esté vacío
      // Los tokens de Turnstile pueden variar en longitud
      const hasValidToken = !!token && token.length > 5; // Más flexible para móviles

      console.log('Captcha validation:', {
        isOk,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasValidToken,
        isMobile:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ),
      });

      // Para mayor compatibilidad, considerar válido si hay token válido, incluso si isOk es false
      return hasValidToken;
    } catch (error) {
      console.error('Error checking captcha:', error);
      return false;
    }
  }

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
    });

    // Siempre deshabilitar si no hay captcha válido
    if (!captchaValid && !FRONTEND_ONLY) {
      submitBtn.disabled = true;

      // En móviles, mostrar botón de verificación manual si hay contenido en campos
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const forceButton = doc.getElementById('force-captcha-check');
      if (isMobile && forceButton && hasContent) {
        // Verificar si realmente hay token pero el estado no se actualiza
        const token = cfResponseInput ? cfResponseInput.value : '';
        if (token && token.length > 5) {
          forceButton.style.display = 'inline-block';
        } else {
          forceButton.style.display = 'none';
        }
      }
      return;
    }

    // Ocultar botón de verificación manual si todo está bien
    const forceButton = doc.getElementById('force-captcha-check');
    if (forceButton) {
      forceButton.style.display = 'none';
    }

    // Aplicar el estado calculado
    submitBtn.disabled = !shouldEnable;
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

  // Estado inicial: botón deshabilitado hasta completar captcha
  if (submitBtn) {
    submitBtn.disabled = true; // Inicialmente deshabilitado
  }
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

    // Intentos múltiples con delays incrementales
    const delays = [100, 300, 500, 800, 1200];

    delays.forEach((delay, index) => {
      setTimeout(() => {
        console.log(`Captcha recheck attempt ${index + 1}`);
        updateSubmitButtonState();

        // En el último intento, verificar explícitamente
        if (index === delays.length - 1) {
          const isValid = isCaptchaValid();
          console.log(`Final captcha validation result: ${isValid}`);

          if (
            isValid &&
            submitBtn &&
            hasContentInFields() &&
            getRemainingCooldown() === 0
          ) {
            submitBtn.disabled = false;
            console.log('Submit button enabled after forced recheck');
          }
        }
      }, delay);
    });
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
        if (cfResponseInput) cfResponseInput.value = token || '';

        // Actualizar estados globales
        globalThis.__captcha_token = token || '';
        globalThis.__captcha_ok = !!token;

        // En móviles, forzar múltiples actualizaciones con delays
        updateSubmitButtonState();
        setTimeout(() => updateSubmitButtonState(), 100);
        setTimeout(() => updateSubmitButtonState(), 300);
        setTimeout(() => updateSubmitButtonState(), 500);
        forceCheckCaptcha();
      } catch (error) {
        console.error('Error in turnstile success callback:', error);
      }
    };

    globalThis.turnstileOnExpired = function () {
      console.log('Fallback turnstile expired');
      try {
        if (cfResponseInput) cfResponseInput.value = '';

        // Limpiar estados globales
        globalThis.__captcha_token = '';
        globalThis.__captcha_ok = false;

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

        // Limpiar estados globales
        globalThis.__captcha_token = '';
        globalThis.__captcha_ok = false;

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
          const isOk = e.detail.ok || false;

          if (cfResponseInput) cfResponseInput.value = token;

          // Actualizar estados globales para compatibilidad
          globalThis.__captcha_token = token;
          globalThis.__captcha_ok = isOk;

          // Forzar múltiples actualizaciones para asegurar que el botón se actualice
          updateSubmitButtonState();
          setTimeout(() => updateSubmitButtonState(), 100);
          setTimeout(() => updateSubmitButtonState(), 300);

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

  // Verificar cooldown al cargar la página
  if (getRemainingCooldown() > 0) {
    startCooldownTimer();
  }

  // Listener del botón de verificación manual (móviles)
  const forceCheckButton = doc.getElementById('force-captcha-check');
  if (forceCheckButton) {
    forceCheckButton.addEventListener('click', () => {
      console.log('Manual captcha verification requested');

      // Feedback visual
      const originalText = forceCheckButton.textContent;
      forceCheckButton.textContent = '🔄 Verificando...';
      forceCheckButton.disabled = true;

      // Ejecutar verificación forzada
      forceCheckCaptcha();

      setTimeout(() => {
        forceCheckButton.textContent = originalText;
        forceCheckButton.disabled = false;

        // Verificar el resultado después de los intentos
        const isValid = isCaptchaValid();
        console.log('Manual verification result:', isValid);

        if (isValid) {
          // Si el captcha es válido, ocultar el botón de verificación manual
          forceCheckButton.style.display = 'none';

          // Actualizar el estado del botón submit
          updateSubmitButtonState();

          if (status) {
            status.textContent = '✅ Captcha verificado correctamente';
            status.classList.add('text-green-600');
            status.classList.remove('text-yellow-600', 'text-red-600');

            // Limpiar mensaje después de 3 segundos
            setTimeout(() => {
              if (status) status.textContent = '';
            }, 3000);
          }
        } else {
          // Si aún hay problemas, mostrar mensaje
          const token = cfResponseInput ? cfResponseInput.value : '';
          if (token && token.length > 5) {
            if (status) {
              status.textContent =
                '⚠️ Captcha completado pero no detectado. Intenta enviar el formulario.';
              status.classList.add('text-yellow-600');
              status.classList.remove('text-green-600', 'text-red-600');
            }
          } else {
            if (status) {
              status.textContent = '❌ Por favor completa el captcha primero';
              status.classList.add('text-red-600');
              status.classList.remove('text-green-600', 'text-yellow-600');
            }
          }
        }
      }, 1500); // Aumentado el tiempo para dar más oportunidad a los intentos
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

        // Limpiar estados del captcha
        if (cfResponseInput) cfResponseInput.value = '';
        globalThis.__captcha_token = '';
        globalThis.__captcha_ok = false;

        // Reiniciar captcha
        try {
          if (captcha && typeof captcha.resetCaptcha === 'function') {
            captcha.resetCaptcha();
          }
        } catch (error) {
          console.error('Error resetting captcha:', error);
        }

        // Deshabilitar botón inmediatamente tras reset
        if (submitBtn) submitBtn.disabled = true;

        markSend();
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
      updateSubmitButtonState();
    }
  }
}
