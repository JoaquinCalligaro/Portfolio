// Guard so this module can be parsed server-side without referencing browser globals
if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.document !== 'undefined'
) {
  // import captcha helpers (dynamic import to keep SSR safe)
  let captcha = null;
  try {
    // dynamic import path relative to public
    // Note: bundlers may inline this; runtime guard ensures server won't execute it
    captcha = await import('/js/contact/captcha.js');
  } catch {
    captcha = null;
  }
  // Contact form client logic extracted from Contact.astro
  // This file is loaded as a module from /js/contact.js

  const doc = globalThis.document;
  // Frontend-only demo mode: allow testing the form without a backend.
  // Enable by adding `data-frontend-only="true"` to the form, by using
  // the URL query `?mockContact=1`, or by setting localStorage `contact:mock=1`.
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

  // expose mocked state via aria attribute for testing/debug
  try {
    if (form && FRONTEND_ONLY) form.setAttribute('data-frontend-mock', 'true');
  } catch {
    /* ignore */
  }
  // Show a small UI hint so testers know they are in mock mode
  try {
    if (form && FRONTEND_ONLY && status) {
      const hint = doc.createElement('div');
      hint.className =
        'mt-2 rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      hint.textContent =
        'Modo de pruebas (frontend-only): el envío se simula localmente.';
      if (status.parentNode)
        status.parentNode.insertBefore(hint, status.nextSibling || status);
    }
  } catch {
    /* ignore */
  }

  // Form fields & validation nodes
  const nameInput = doc.getElementById('name');
  const emailInput = doc.getElementById('email');
  const nameError = doc.getElementById('name-error');
  const emailError = doc.getElementById('email-error');
  const messageEditor = doc.getElementById('message-editor');
  const messageError = doc.getElementById('message-error');
  const honeypot = doc.getElementById('website');
  const cfResponseInput = doc.getElementById('cf-turnstile-response');

  // previous simple regex removed; we now use HTML5 checkValidity + a stricter fallback

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
    } catch {
      /* ignore */
    }
  }

  function validateName() {
    if (!nameInput) return true;
    const v = nameInput.value.trim();
    if (!v) {
      setFieldError(nameError, 'El nombre es requerido.');
      return false;
    }
    if (v.length < 2) {
      setFieldError(nameError, 'El nombre es muy corto.');
      return false;
    }
    if (v.length > 100) {
      setFieldError(nameError, 'El nombre es muy largo.');
      return false;
    }
    setFieldError(nameError, '');
    return true;
  }

  function validateEmail() {
    if (!emailInput) return true;
    const v = emailInput.value.trim();
    if (!v) {
      setFieldError(emailError, 'El email es requerido.');
      return false;
    }

    // sensible length limits (RFC allows up to 254 total)
    if (v.length > 254) {
      setFieldError(emailError, 'El email es demasiado largo.');
      return false;
    }

    // prefer native HTML5 validation when available (type="email" or pattern)
    try {
      if (
        typeof emailInput.checkValidity === 'function' &&
        !emailInput.checkValidity()
      ) {
        setFieldError(emailError, 'Formato de email inválido.');
        return false;
      }
    } catch {
      // ignore and fall back to regex
    }

    // stricter regex fallback to catch common invalid forms
    const strictRe =
      /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$/;
    if (!strictRe.test(v)) {
      setFieldError(emailError, 'Formato de email inválido.');
      return false;
    }

    setFieldError(emailError, '');
    return true;
  }

  function validateMessage() {
    if (!messageEditor) return true;
    const v = (messageEditor.innerText || '').trim();
    if (!v) {
      setFieldError(messageError, 'El mensaje es requerido.');
      return false;
    }
    if (v.length < 10) {
      setFieldError(
        messageError,
        'El mensaje debe tener al menos 10 caracteres.'
      );
      return false;
    }
    if (v.length > 5000) {
      setFieldError(messageError, 'El mensaje excede la longitud máxima.');
      return false;
    }
    setFieldError(messageError, '');
    return true;
  }

  function validateForm() {
    const ok = validateName() && validateEmail() && validateMessage();
    if (submitBtn) submitBtn.disabled = !ok;
    return ok;
  }

  // wire up revalidation on user input
  if (nameInput) nameInput.addEventListener('input', validateForm);
  if (emailInput) emailInput.addEventListener('input', validateForm);
  if (messageEditor) {
    messageEditor.addEventListener('input', validateForm);
    messageEditor.addEventListener('blur', validateForm);
  }

  // Lightweight presence check (does not show validation errors) so the submit
  // button starts disabled while fields are empty.
  function hasContent() {
    const n = nameInput && nameInput.value ? nameInput.value.trim() : '';
    const e = emailInput && emailInput.value ? emailInput.value.trim() : '';
    const m =
      messageEditor && (messageEditor.innerText || messageEditor.textContent)
        ? (messageEditor.innerText || messageEditor.textContent).trim()
        : '';
    return n.length > 0 && e.length > 0 && m.length > 0;
  }

  function updateSubmitPresence() {
    try {
      const ok =
        captcha && typeof captcha.isCaptchaOk === 'function'
          ? captcha.isCaptchaOk()
          : false;
      if (submitBtn) submitBtn.disabled = !hasContent() || !ok;
    } catch {
      if (submitBtn) submitBtn.disabled = !hasContent();
    }
  }

  // Keep submit disabled initially if fields empty
  updateSubmitPresence();

  // Update presence state on input without immediately showing validation errors
  if (nameInput) nameInput.addEventListener('input', updateSubmitPresence);
  if (emailInput) emailInput.addEventListener('input', updateSubmitPresence);
  if (messageEditor)
    messageEditor.addEventListener('input', updateSubmitPresence);

  // Rich text editor toolbar
  const editor = messageEditor;
  const hiddenMessage = doc.getElementById('message');
  const toolbarAttach = doc.getElementById('toolbar-attach');
  const fontFamily = doc.getElementById('font-family');
  const fontSize = doc.getElementById('font-size');

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

  if (fontFamily)
    fontFamily.addEventListener('change', (e) =>
      exec('fontName', e.target.value)
    );
  if (fontSize)
    fontSize.addEventListener('change', (e) =>
      exec('fontSize', e.target.value)
    );
  if (toolbarAttach) {
    // no-op: attachments support removed
  }

  // ensure editor content is submitted
  function syncEditor() {
    if (hiddenMessage) hiddenMessage.value = editor ? editor.innerHTML : '';
  }

  // Time-trap: measure time from page load to submit to detect bots
  const startTime = Date.now();
  // alias for clarity with older snippets/tests
  const pageLoadTime = startTime;
  const timeInput = doc.getElementById('time_spent');
  const formTokenInput = doc.getElementById('form_token');

  // Simple form token: generate per page load and store in-memory; if page hidden -> invalidate
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

  // If captcha helper loaded, wire events; otherwise fall back to local no-op
  if (captcha) {
    try {
      // rebind internal cf response input reference inside captcha module if needed
      if (typeof captcha.setCaptchaState === 'function') {
        // nothing to call now; captcha module attaches its own global callbacks
      }
    } catch {
      /* ignore */
    }
  } else {
    // fallback: no-op global callbacks to avoid runtime errors
    globalThis.turnstileOnSuccess = function (token) {
      try {
        if (cfResponseInput) cfResponseInput.value = token || '';
        if (submitBtn) submitBtn.disabled = !hasContent();
      } catch {
        /* ignore */
      }
    };
    globalThis.turnstileOnExpired = function () {
      try {
        if (cfResponseInput) cfResponseInput.value = '';
        if (submitBtn) submitBtn.disabled = true;
      } catch {
        /* ignore */
      }
    };
  }

  // Invalidate token when switching tabs (discourages token reuse across tabs)
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

  // If the captcha helper dispatches events on token/state changes, listen and update UI
  try {
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('captcha:change', () => {
        try {
          // sync hidden token input if module exposes getter
          const token =
            captcha && typeof captcha.getCaptchaToken === 'function'
              ? captcha.getCaptchaToken()
              : cfResponseInput && cfResponseInput.value
                ? cfResponseInput.value
                : '';
          if (cfResponseInput) cfResponseInput.value = token || '';
          // enable submit only when fields have content and captcha reports ok
          const ok =
            captcha && typeof captcha.isCaptchaOk === 'function'
              ? captcha.isCaptchaOk()
              : !!token;
          if (submitBtn) submitBtn.disabled = !hasContent() || !ok;
        } catch {
          /* ignore */
        }
      });
    }
  } catch {
    /* ignore */
  }

  // Local rate limit: allow 1 send per random(30..60) seconds per client
  const RATE_KEY = 'contact:lastSend';
  function allowedByRateLimit() {
    try {
      const ls = globalThis.localStorage;
      const last = Number(ls ? ls.getItem(RATE_KEY) || 0 : 0);
      const now = Date.now();
      const wait =
        Number(ls ? ls.getItem('contact:wait') || 0 : 0) ||
        (30 + Math.floor(Math.random() * 31)) * 1000;
      if (ls && !ls.getItem('contact:wait'))
        ls.setItem('contact:wait', String(wait));
      if (now - last < wait) return false;
      return true;
    } catch {
      return true;
    }
  }
  function markSend() {
    try {
      const ls = globalThis.localStorage;
      if (ls) ls.setItem(RATE_KEY, String(Date.now()));
      // keep the same wait value for the session
    } catch {
      /* ignore */
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // honeypot check: if filled, treat as bot and abort
      if (honeypot && (honeypot.value || '').trim()) {
        // keep UX consistent: show alert and status
        try {
          if (typeof globalThis.alert === 'function')
            globalThis.alert('Bot detectado (honeypot)');
        } catch {
          /* ignore */
        }
        if (status) {
          status.textContent = 'Envío detectado como spam.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // record time spent and reject if too fast (< 2500ms)
      const elapsed = Date.now() - pageLoadTime;
      if (timeInput) timeInput.value = String(elapsed);
      if (elapsed < 2500) {
        try {
          if (typeof globalThis.alert === 'function')
            globalThis.alert('Demasiado rápido, parece bot');
        } catch {
          /* ignore */
        }
        if (status) {
          status.textContent = 'Envío demasiado rápido (posible bot).';
          status.classList.add('text-red-600');
        }
        return;
      }

      // rate limit (client-side)
      if (!allowedByRateLimit()) {
        if (status) {
          status.textContent = 'Espera un momento antes de volver a enviar.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // form token check
      if (!formToken) {
        if (status) {
          status.textContent =
            'Formulario inválido. Refresca la página e intenta de nuevo.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // captcha must be completed (Turnstile) unless running in frontend-only mock
      if (!FRONTEND_ONLY) {
        // prefer captcha module token, fallback to hidden input
        const token =
          captcha && typeof captcha.getCaptchaToken === 'function'
            ? captcha.getCaptchaToken()
            : cfResponseInput && cfResponseInput.value
              ? cfResponseInput.value
              : '';
        const captchaOkNow =
          captcha && typeof captcha.isCaptchaOk === 'function'
            ? captcha.isCaptchaOk()
            : !!token;
        if (!captchaOkNow || !token) {
          try {
            try {
              if (typeof globalThis.alert === 'function')
                globalThis.alert('Por favor completa el captcha.');
            } catch {
              /* ignore */
            }
            if (status) {
              status.textContent =
                'Por favor completa el captcha antes de enviar.';
              status.classList.add('text-red-600');
            }
            if (submitBtn) submitBtn.disabled = true;
          } catch {
            /* ignore */
          }
          return;
        }
      }

      // final validation before sending
      if (!validateForm()) {
        if (status) {
          status.textContent = 'Por favor corrige los errores antes de enviar.';
          status.classList.add('text-red-600');
        }
        return;
      }
      if (status) status.textContent = '';
      if (status) status.className = 'text-sm';
      if (submitBtn) submitBtn.disabled = true;
      // Preserve original button children (may contain localized nodes); restore later
      const originalBtnChildren = submitBtn
        ? Array.from(submitBtn.childNodes).map((n) => n.cloneNode(true))
        : null;
      // prevent visual deformation: lock the current width as inline style
      let _prevBtnInlineWidth = null;
      try {
        if (submitBtn) {
          _prevBtnInlineWidth = submitBtn.style.width || '';
          const rect = submitBtn.getBoundingClientRect();
          if (rect && rect.width)
            submitBtn.style.width = Math.ceil(rect.width) + 'px';
        }
      } catch {
        /* ignore measurement errors */
      }
      if (submitBtn) submitBtn.textContent = 'Enviando...';

      try {
        // sync rich editor to hidden input
        syncEditor();

        // Basic client-side sanitization: escape < and > in name and message
        const sanitize = (s) =>
          String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        try {
          if (nameInput && nameInput.value)
            nameInput.value = sanitize(nameInput.value);
        } catch {
          /* ignore */
        }
        try {
          if (hiddenMessage && hiddenMessage.value)
            hiddenMessage.value = sanitize(hiddenMessage.value);
        } catch {
          /* ignore */
        }

        const FD = globalThis.FormData;
        const fd = FD ? new FD(form) : null;

        // progressive enhancement: use fetch to send FormData (server expects form-type)
        // If running in frontend-only mock mode, simulate network & success
        let res = null;
        let json = null;
        if (FRONTEND_ONLY) {
          // simulate a short network delay
          await new Promise((r) => {
            const st = globalThis.setTimeout;
            if (typeof st === 'function')
              return st(r, 700 + Math.random() * 800);
            // fallback immediately resolve
            return r();
          });
          res = { ok: true };
          json = { ok: true };
        } else {
          const fetchFn = globalThis.fetch;
          if (!fetchFn) throw new Error('fetch not available');
          // Request JSON responses when possible (Formspree supports Accept: application/json)
          res = await fetchFn(form.action, {
            method: 'POST',
            body: fd,
            headers: { Accept: 'application/json' },
          });
          try {
            json = await res.json();
          } catch {
            // fallback: try to read as text (but don't inject raw HTML into the UI)
            const txt = await res.text().catch(() => '');
            json = { ok: res.ok, text: txt };
          }
        }

        const success = res && res.ok && json && json.ok !== false;
        if (success) {
          if (status) {
            status.textContent = 'Mensaje enviado. Gracias!';
            status.classList.add('text-green-600');
            status.classList.remove('text-red-600');
          }
          form.reset();
          // clear captcha state when form resets
          try {
            if (captcha && typeof captcha.resetCaptcha === 'function')
              captcha.resetCaptcha();
            else if (
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
          markSend();
        } else {
          // Attempt an iframe fallback submit for CORS/network cases so the
          // form still reaches Formspree even when fetch can't read the response.
          let attemptedFallback = false;
          try {
            if (!FRONTEND_ONLY && typeof doc.createElement === 'function') {
              const frameName = 'contact-iframe-' + String(Date.now());
              const iframe = doc.createElement('iframe');
              iframe.name = frameName;
              iframe.style.display = 'none';
              doc.body.appendChild(iframe);
              // temporarily target the form to the iframe and submit natively
              const prevTarget = form.getAttribute('target');
              form.setAttribute('target', frameName);
              try {
                form.submit();
                attemptedFallback = true;
                // reflect success in UI since native POST will reach Formspree
                if (status) {
                  status.textContent = 'Mensaje enviado. Gracias!';
                  status.classList.add('text-green-600');
                  status.classList.remove('text-red-600');
                }
                try {
                  form.reset();
                  if (captcha && typeof captcha.resetCaptcha === 'function')
                    captcha.resetCaptcha();
                } catch {
                  /* ignore */
                }
                markSend();
              } finally {
                // cleanup
                if (prevTarget) form.setAttribute('target', prevTarget);
                else form.removeAttribute('target');
                // remove iframe after a short delay to allow the request to complete
                try {
                  const st = globalThis.setTimeout;
                  if (typeof st === 'function') {
                    st(() => {
                      try {
                        if (iframe.parentNode)
                          iframe.parentNode.removeChild(iframe);
                      } catch {
                        /* ignore */
                      }
                    }, 5000);
                  }
                } catch {
                  /* ignore */
                }
              }
            }
          } catch {
            /* ignore fallback errors */
          }

          if (!attemptedFallback) {
            if (status) {
              // Prefer structured error messages, otherwise show a short safe snippet
              if (json && typeof json.error === 'string' && json.error.trim()) {
                status.textContent = json.error;
              } else if (
                json &&
                typeof json.text === 'string' &&
                json.text.trim()
              ) {
                // show a short sanitized excerpt of the response text
                const excerpt = json.text
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 800);
                status.textContent = 'Respuesta del servidor: ' + excerpt;
              } else {
                status.textContent =
                  'Ocurrió un error al enviar. Intenta de nuevo.';
              }
              status.classList.add('text-red-600');
              status.classList.remove('text-green-600');
            }
            // log full response for debugging
            try {
              if (
                typeof globalThis.console === 'object' &&
                typeof globalThis.console.warn === 'function'
              )
                globalThis.console.warn('Contact form send failed', {
                  res,
                  json,
                });
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        if (status) {
          status.textContent =
            'Ocurrió un error de conexión. Intenta más tarde.';
          status.classList.add('text-red-600');
          status.classList.remove('text-green-600');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        // restore original button children if we saved them and restore inline width
        try {
          if (
            submitBtn &&
            originalBtnChildren &&
            Array.isArray(originalBtnChildren)
          ) {
            submitBtn.replaceChildren(
              ...originalBtnChildren.map((n) => n.cloneNode(true))
            );
          } else if (submitBtn) {
            submitBtn.textContent = 'Enviar';
          }
        } catch {
          if (submitBtn) submitBtn.textContent = 'Enviar';
        }
        try {
          if (submitBtn && _prevBtnInlineWidth !== null) {
            // restore previous inline width (may be empty)
            submitBtn.style.width = _prevBtnInlineWidth || '';
          }
        } catch {
          /* ignore */
        }
      }
    });
  }
}
