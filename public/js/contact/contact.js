// Guard so this module can be parsed server-side without referencing browser globals
if (
  typeof globalThis !== 'undefined' &&
  typeof globalThis.document !== 'undefined'
) {
  // Contact form client logic extracted from Contact.astro
  // This file is loaded as a module from /js/contact.js

  const doc = globalThis.document;
  const form = doc.getElementById('contact-form');
  const status = doc.getElementById('form-status');
  const submitBtn = doc.getElementById('submit-btn');
  const fileInput = doc.getElementById('file-input');
  const dropArea = doc.getElementById('drop-area');
  const attachmentsList = doc.getElementById('attachments-list');
  const attachmentsSummary = doc.getElementById('attachments-summary');

  // Form fields & validation nodes
  const nameInput = doc.getElementById('name');
  const emailInput = doc.getElementById('email');
  const nameError = doc.getElementById('name-error');
  const emailError = doc.getElementById('email-error');
  const messageEditor = doc.getElementById('message-editor');
  const messageError = doc.getElementById('message-error');
  const honeypot = doc.getElementById('website');

  // attachments state
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 5; // per file
  let attachments = []; // { file, id }

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
    if (submitBtn) submitBtn.disabled = !hasContent();
  }

  // Keep submit disabled initially if fields empty
  updateSubmitPresence();

  // Update presence state on input without immediately showing validation errors
  if (nameInput) nameInput.addEventListener('input', updateSubmitPresence);
  if (emailInput) emailInput.addEventListener('input', updateSubmitPresence);
  if (messageEditor)
    messageEditor.addEventListener('input', updateSubmitPresence);

  function updateAttachmentsUI() {
    if (!attachmentsList) return;
    attachmentsList.innerHTML = '';
    attachments.forEach((a) => {
      const li = doc.createElement('li');
      li.className =
        'flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2 dark:bg-gray-800';

      const info = doc.createElement('div');
      info.className = 'flex items-center gap-3';

      if (a.file.type.startsWith('image/')) {
        const img = doc.createElement('img');
        img.src = globalThis.URL ? globalThis.URL.createObjectURL(a.file) : '';
        img.className = 'h-12 w-12 rounded-md object-cover';
        info.appendChild(img);
      }

      const meta = doc.createElement('div');
      meta.innerHTML = `<div class="text-sm font-medium text-gray-900 dark:text-gray-100">${a.file.name}</div><div class="text-xs text-gray-500 dark:text-gray-400">${(a.file.size / 1024 / 1024).toFixed(2)} MB</div>`;
      info.appendChild(meta);

      const removeBtn = doc.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'ml-auto text-sm text-red-600 dark:text-red-400';
      removeBtn.innerText = 'Eliminar';
      removeBtn.addEventListener('click', () => {
        if (
          globalThis.URL &&
          typeof globalThis.URL.revokeObjectURL === 'function'
        )
          globalThis.URL.revokeObjectURL(a.file);
        attachments = attachments.filter((x) => x.id !== a.id);
        updateAttachmentsUI();
      });

      li.appendChild(info);
      li.appendChild(removeBtn);
      attachmentsList.appendChild(li);
    });

    if (attachmentsSummary) {
      attachmentsSummary.textContent = attachments.length
        ? `${attachments.length} archivo(s) adjuntado(s)`
        : '';
    }
  }

  function handleFiles(files) {
    const toAdd = Array.from(files);
    for (const f of toAdd) {
      if (attachments.length >= MAX_FILES) break;
      if (f.size / 1024 / 1024 > MAX_SIZE_MB) {
        if (globalThis.alert)
          globalThis.alert(
            `El archivo ${f.name} excede el tamaño máximo de ${MAX_SIZE_MB}MB`
          );
        continue;
      }
      attachments.push({
        file: f,
        id:
          globalThis.crypto &&
          typeof globalThis.crypto.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : Date.now() + Math.random(),
      });
    }
    updateAttachmentsUI();
  }

  // file input change
  if (fileInput) {
    fileInput.addEventListener('change', (ev) => {
      handleFiles(ev.target.files || []);
      fileInput.value = '';
    });
  }

  // drag & drop
  if (dropArea) {
    ['dragenter', 'dragover'].forEach((evt) => {
      dropArea.addEventListener(evt, (e) => {
        e.preventDefault();
        // highlight for light and dark
        dropArea.classList.add(
          'bg-gray-100',
          'ring-2',
          'ring-indigo-400',
          'dark:ring-indigo-500',
          'dark:bg-gray-800'
        );
      });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      dropArea.addEventListener(evt, (e) => {
        e.preventDefault();
        dropArea.classList.remove(
          'bg-gray-100',
          'ring-2',
          'ring-indigo-400',
          'dark:ring-indigo-500',
          'dark:bg-gray-800'
        );
      });
    });
    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) handleFiles(dt.files);
    });
    // allow clicking the label to trigger file input
    const label = dropArea.querySelector('label[for="file-input"]');
    if (label) label.addEventListener('click', () => fileInput.click());
  }

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
  if (toolbarAttach)
    toolbarAttach.addEventListener('click', () => fileInput.click());

  // ensure editor content is submitted
  function syncEditor() {
    if (hiddenMessage) hiddenMessage.value = editor ? editor.innerHTML : '';
  }

  // Time-trap: measure time from page load to submit to detect bots
  const startTime = Date.now();
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
        // don't proceed with network request; mark as spam and exit
        if (status) {
          status.textContent = 'Envío detectado como spam.';
          status.classList.add('text-red-600');
        }
        return;
      }

      // record time spent and reject if too fast (< 2500ms)
      const elapsed = Date.now() - startTime;
      if (timeInput) timeInput.value = String(elapsed);
      if (elapsed < 2500) {
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
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
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
        // append attachments
        attachments.forEach((a) =>
          fd.append('attachments', a.file, a.file.name)
        );

        // progressive enhancement: use fetch to send FormData (server expects form-type)
        const fetchFn = globalThis.fetch;
        const res = fetchFn
          ? await fetchFn(form.action, { method: 'POST', body: fd })
          : await Promise.reject(new Error('fetch not available'));
        const json = await res.json().catch(() => ({ ok: res.ok }));

        if (res.ok && json.ok !== false) {
          if (status) {
            status.textContent = 'Mensaje enviado. Gracias!';
            status.classList.add('text-green-600');
            status.classList.remove('text-red-600');
          }
          form.reset();
          markSend();
        } else {
          if (status) {
            status.textContent =
              json?.error || 'Ocurrió un error al enviar. Intenta de nuevo.';
            status.classList.add('text-red-600');
            status.classList.remove('text-green-600');
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
        if (submitBtn) submitBtn.textContent = originalBtnText || 'Enviar';
      }
    });
  }
}
