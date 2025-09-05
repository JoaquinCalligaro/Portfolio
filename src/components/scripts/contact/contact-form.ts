/* eslint-env browser, es2021 */
/* eslint no-console: 0 */
/* eslint no-empty: 0 */
/* eslint no-unused-vars: 0 */
/* global window, document, localStorage, FormData, fetch, console, setTimeout, setInterval */

// TypeScript types for Contact Form
interface ValidationResult {
  ok: boolean;
  reason?: 'required' | 'tooShort' | 'tooLong' | 'invalidChars';
}

interface TouchedState {
  name: boolean;
  email: boolean;
  message: boolean;
}

interface FormElements {
  form: HTMLFormElement;
  nameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  messageEditor: HTMLElement | null;
  hiddenMessageInput: HTMLInputElement | null;
  messageInput: HTMLElement;
  submitBtn: HTMLButtonElement;
}

interface StatusElements {
  cooldownDisplay: HTMLElement | null;
  formStatus: HTMLElement | null;
  nameError: HTMLElement | null;
  emailError: HTMLElement | null;
  messageError: HTMLElement | null;
  messageCount: HTMLElement | null;
}

interface Config {
  RATE_LIMIT_MS: number;
  LAST_SEND_KEY: string;
  NAME_MAX_LENGTH: number;
  MESSAGE_MAX_LENGTH: number;
  MESSAGE_MIN_LENGTH: number;
}

interface WindowWithTranslations extends Window {
  TRANSLATIONS?: Record<string, Record<string, unknown>>;
}

// Clean, captcha-free contact client
(function (): void {
  'use strict';

  const CONFIG: Config = {
    RATE_LIMIT_MS: 1 * 60 * 1000, // 1 minute
    LAST_SEND_KEY: 'contact:lastSend',
    NAME_MAX_LENGTH: 50,
    MESSAGE_MAX_LENGTH: 1000,
    MESSAGE_MIN_LENGTH: 10,
  };

  function qs(sel: string): HTMLElement | null {
    return document.querySelector(sel);
  }

  function now(): number {
    return Date.now();
  }

  document.addEventListener('DOMContentLoaded', function (): void {
    const form = (qs('#contactForm') ||
      qs('form#contactForm') ||
      qs('form[name="contact"]')) as HTMLFormElement | null;

    const nameInput = (qs('#name') ||
      qs('input[name="name"]')) as HTMLInputElement | null;
    const emailInput = (qs('#email') ||
      qs('input[name="email"]')) as HTMLInputElement | null;

    // Prefer the rich editor (#message-editor) if present, keep a reference to the hidden input used for submission
    const messageEditor = qs('#message-editor');
    const hiddenMessageInput = (qs('#message') ||
      qs('input[name="message"]')) as HTMLInputElement | null;
    const messageInput =
      messageEditor || hiddenMessageInput || qs('textarea[name="message"]');

    const submitBtn = (qs('#submitBtn') ||
      qs('#submit-btn') ||
      qs('button[type="submit"]')) as HTMLButtonElement | null;

    if (!form || !nameInput || !emailInput || !messageInput || !submitBtn)
      return;

    const elements: FormElements = {
      form,
      nameInput,
      emailInput,
      messageEditor,
      hiddenMessageInput,
      messageInput,
      submitBtn,
    };

    // Store the original text or use translation key if available
    const translationKey = submitBtn.dataset.translationKey;
    if (translationKey) {
      // Don't override if using translation system
      submitBtn.dataset.defaultLabel = '';
    } else {
      submitBtn.dataset.defaultLabel =
        submitBtn.textContent ||
        (submitBtn as HTMLInputElement).value ||
        'Send';
    }

    function getLastSend(): number {
      const v = localStorage.getItem(CONFIG.LAST_SEND_KEY);
      return v ? Number(v) : 0;
    }

    function isCooldownActive(): boolean {
      const last = getLastSend();
      return last && now() - last < CONFIG.RATE_LIMIT_MS;
    }

    function timeLeftMs(): number {
      const last = getLastSend();
      const diff = CONFIG.RATE_LIMIT_MS - (now() - last);
      return diff > 0 ? diff : 0;
    }

    function validateName(v: string): ValidationResult {
      const t = String(v || '').trim();
      if (!t) return { ok: false, reason: 'required' };
      if (t.length < 2) return { ok: false, reason: 'tooShort' };
      if (t.length > CONFIG.NAME_MAX_LENGTH)
        return { ok: false, reason: 'tooLong' };

      // Allow only Unicode letters, spaces, hyphens and apostrophes commonly used in names
      let lettersOnly = true;
      try {
        // Regex: one or more of letters (\p{L}), spaces, hyphen, apostrophe
        const re = /^(?:[\p{L}]+[ \-']?)+$/u;
        lettersOnly = re.test(t);
      } catch {
        // Fallback: disallow digits and most punctuation
        lettersOnly = !/[^A-Za-z \-']/.test(t);
      }

      if (!lettersOnly) return { ok: false, reason: 'invalidChars' };
      return { ok: true };
    }

    function validateEmail(v: string): ValidationResult {
      const t = String(v || '').trim();
      if (!t) return { ok: false };
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return { ok: re.test(t) };
    }

    function validateMessage(
      v: string | HTMLElement | null | undefined
    ): ValidationResult {
      // Accept either a DOM node (contenteditable) or a string/value
      let t = '';
      try {
        if (!v && (typeof v === 'number' ? v !== 0 : true)) {
          t = '';
        } else if (typeof v === 'string') {
          t = v;
        } else if (v && typeof (v as HTMLInputElement).value === 'string') {
          t = (v as HTMLInputElement).value;
        } else if (v && typeof (v as HTMLElement).textContent === 'string') {
          t = (v as HTMLElement).textContent || '';
        } else if (v && typeof (v as HTMLElement).innerText === 'string') {
          t = (v as HTMLElement).innerText || '';
        } else {
          t = String(v || '');
        }
      } catch {
        t = String(v || '');
      }

      t = String(t || '').trim();
      if (!t) return { ok: false, reason: 'required' };
      if (t.length < CONFIG.MESSAGE_MIN_LENGTH)
        return { ok: false, reason: 'tooShort' };
      if (t.length > CONFIG.MESSAGE_MAX_LENGTH)
        return { ok: false, reason: 'tooLong' };
      return { ok: true };
    }

    function isFormValid(): boolean {
      // When using a contenteditable editor, prefer reading from the editor; otherwise use the hidden input
      let messageVal = '';
      try {
        if (elements.messageEditor) {
          messageVal =
            elements.messageEditor.textContent ||
            elements.messageEditor.innerText ||
            '';
        } else if (
          elements.messageInput &&
          typeof (elements.messageInput as HTMLInputElement).value === 'string'
        ) {
          messageVal = (elements.messageInput as HTMLInputElement).value;
        } else {
          messageVal = String(elements.messageInput || '');
        }
      } catch {
        messageVal = '';
      }

      return (
        validateName(elements.nameInput.value).ok &&
        validateEmail(elements.emailInput.value).ok &&
        validateMessage(messageVal).ok
      );
    }

    const statusElements: StatusElements = {
      cooldownDisplay: qs('#cooldown-display'),
      formStatus: qs('#form-status'),
      nameError: qs('#name-error'),
      emailError: qs('#email-error'),
      messageError: qs('#message-error'),
      messageCount: qs('#message-count'),
    };

    // Bandera para saber si el usuario ya intentó enviar el formulario
    let hasAttemptedSubmit = false;
    // Campos que el usuario ya tocó / salió (blur) -> muestra solo ese error
    const touched: TouchedState = { name: false, email: false, message: false };

    function formatTimeStr(ms: number): string {
      const totalSec = Math.ceil(ms / 1000);
      if (totalSec <= 0) return '0s';
      if (totalSec < 60) return totalSec + 's';
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return mins + 'm ' + (secs < 10 ? '0' + secs : secs) + 's';
    }

    function resolveTranslation(key: string, lang: string): string | null {
      try {
        if (
          typeof window === 'undefined' ||
          !(window as WindowWithTranslations).TRANSLATIONS
        )
          return null;
        const parts = key.split('.');
        const docLang = document.documentElement?.lang || null;
        const translations = (window as WindowWithTranslations).TRANSLATIONS;
        let value: unknown =
          (translations && (translations[lang] || translations[docLang])) ||
          null;

        for (let i = 0; i < parts.length; i++) {
          if (
            !value ||
            typeof value !== 'object' ||
            value === null ||
            !(parts[i] in (value as Record<string, unknown>))
          ) {
            return null;
          }
          value = (value as Record<string, unknown>)[parts[i]];
        }
        return typeof value === 'string' ? value : null;
      } catch {
        return null;
      }
    }

    function updateCooldownDisplay(): void {
      try {
        if (!statusElements.cooldownDisplay) return;
        if (!isCooldownActive()) {
          statusElements.cooldownDisplay.style.display = 'none';
          try {
            statusElements.cooldownDisplay.classList.add('hidden');
          } catch {}
          return;
        }
        const msLeft = timeLeftMs();
        const timeStr = formatTimeStr(msLeft);
        // Try to use translations if available
        const lang = document.documentElement.lang || 'ES';
        const tpl =
          resolveTranslation('contact.cooldownWait', lang) ||
          resolveTranslation('contact.cooldownWait', 'ES') ||
          'Please wait ${timeStr} before sending another message.';
        const text = tpl
          .replace('${timeStr}', timeStr)
          .replace('${total}', timeStr);
        statusElements.cooldownDisplay.style.display = '';
        try {
          statusElements.cooldownDisplay.classList.remove('hidden');
        } catch {}
        statusElements.cooldownDisplay.textContent = text;
      } catch {
        // noop
      }
    }

    function showValidationErrors(): void {
      try {
        const lang = document.documentElement.lang || 'ES';
        // name
        try {
          if (statusElements.nameError) {
            const nameValidation = validateName(elements.nameInput.value);
            const invalidName = !nameValidation.ok;
            if (invalidName && (hasAttemptedSubmit || touched.name)) {
              // Show specific messages based on reason codes
              if (nameValidation.reason === 'invalidChars') {
                statusElements.nameError.textContent =
                  resolveTranslation('contact.invalidNameChars', lang) ||
                  "Name can only contain letters, spaces and -'";
              } else if (nameValidation.reason === 'tooLong') {
                statusElements.nameError.textContent =
                  (resolveTranslation('contact.nameTooLong', lang) ||
                    'Name is too long') +
                  ' (' +
                  CONFIG.NAME_MAX_LENGTH +
                  ')';
              } else if (nameValidation.reason === 'tooShort') {
                statusElements.nameError.textContent =
                  resolveTranslation('contact.nameRequired', lang) ||
                  'Name required';
              } else {
                statusElements.nameError.textContent =
                  resolveTranslation('contact.nameRequired', lang) ||
                  'Name required';
              }
              statusElements.nameError.classList.remove('hidden');
            } else {
              statusElements.nameError.textContent = '';
              statusElements.nameError.classList.add('hidden');
            }
          }
        } catch {
          // noop
        }
        // email
        try {
          if (statusElements.emailError) {
            const invalidEmail = !validateEmail(elements.emailInput.value).ok;
            if (invalidEmail && (hasAttemptedSubmit || touched.email)) {
              statusElements.emailError.textContent =
                resolveTranslation('contact.invalidEmail', lang) ||
                'Invalid email';
              statusElements.emailError.classList.remove('hidden');
            } else {
              statusElements.emailError.textContent = '';
              statusElements.emailError.classList.add('hidden');
            }
          }
        } catch {
          // noop
        }
        // message
        try {
          let messageVal = '';
          try {
            if (elements.messageEditor) {
              messageVal =
                elements.messageEditor.textContent ||
                elements.messageEditor.innerText ||
                '';
            } else if (
              elements.messageInput &&
              typeof (elements.messageInput as HTMLInputElement).value ===
                'string'
            ) {
              messageVal = (elements.messageInput as HTMLInputElement).value;
            }
          } catch {
            messageVal = '';
          }
          if (statusElements.messageError) {
            const messageValidation = validateMessage(messageVal);
            const invalidMsg = !messageValidation.ok;
            if (invalidMsg && (hasAttemptedSubmit || touched.message)) {
              if (messageValidation.reason === 'tooLong') {
                const template =
                  resolveTranslation('contact.characterLimitExceeded', lang) ||
                  'Character limit exceeded. Maximum ${max} characters allowed.';
                statusElements.messageError.textContent = template.replace(
                  '${max}',
                  CONFIG.MESSAGE_MAX_LENGTH.toString()
                );
              } else if (messageValidation.reason === 'tooShort') {
                statusElements.messageError.textContent =
                  resolveTranslation('contact.messageMinLength', lang) ||
                  'Message is too short';
              } else {
                statusElements.messageError.textContent =
                  resolveTranslation('contact.messageMinLength', lang) ||
                  'Message is too short';
              }
              statusElements.messageError.classList.remove('hidden');
            } else {
              statusElements.messageError.textContent = '';
              statusElements.messageError.classList.add('hidden');
            }
          }
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    }

    function hideAllValidationErrors(): void {
      try {
        [
          statusElements.nameError,
          statusElements.emailError,
          statusElements.messageError,
        ].forEach(function (errorElement) {
          if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
          }
        });
        // Also hide character count indicator
        if (statusElements.messageCount) {
          statusElements.messageCount.textContent = '';
          statusElements.messageCount.classList.add('hidden');
        }
        touched.name = touched.email = touched.message = false;
        hasAttemptedSubmit = false;
      } catch {
        // noop
      }
    }

    function updateMessageCharCount(): void {
      try {
        if (!statusElements.messageCount) return;

        let messageVal = '';
        try {
          if (elements.messageEditor) {
            messageVal =
              elements.messageEditor.textContent ||
              elements.messageEditor.innerText ||
              '';
          } else if (
            elements.messageInput &&
            typeof (elements.messageInput as HTMLInputElement).value ===
              'string'
          ) {
            messageVal = (elements.messageInput as HTMLInputElement).value;
          }
        } catch {
          messageVal = '';
        }

        const currentLength = String(messageVal || '').trim().length;
        const minLength = CONFIG.MESSAGE_MIN_LENGTH;

        if (currentLength > 0 && currentLength < minLength) {
          const remaining = minLength - currentLength;
          const lang = document.documentElement.lang || 'ES';
          const template =
            resolveTranslation('contact.messageCharCount', lang) ||
            'Missing ${count} characters (minimum 10).';
          const text = template.replace('${count}', remaining.toString());

          statusElements.messageCount.textContent = text;
          statusElements.messageCount.classList.remove('hidden');
        } else {
          statusElements.messageCount.textContent = '';
          statusElements.messageCount.classList.add('hidden');
        }
      } catch {
        // noop
      }
    }

    function clearStatus(): void {
      try {
        if (!statusElements.formStatus) return;
        statusElements.formStatus.textContent = '';
        statusElements.formStatus.style.display = 'none';
        // ensure Tailwind 'hidden' is present so it stays hidden in case CSS overrides display
        statusElements.formStatus.classList.add('hidden');
        // clear any status marker so the component can decide styling
        try {
          if (statusElements.formStatus.dataset) {
            delete statusElements.formStatus.dataset.status;
          }
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    }

    function showStatus(type: string, text: string): void {
      try {
        if (!statusElements.formStatus) return;
        statusElements.formStatus.textContent = text || '';
        // make visible both via style and by removing tailwind 'hidden'
        statusElements.formStatus.style.display = '';
        statusElements.formStatus.classList.remove('hidden');
        // Leave styling (text color / border) to the server component / CSS.
        // Signal the desired status type via a data attribute so the component can react if needed.
        try {
          if (statusElements.formStatus.dataset) {
            statusElements.formStatus.dataset.status = type || 'info';
          }
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    }

    function updateSubmitButtonState(): void {
      // Mostrar errores si el usuario intentó enviar o tocó campos
      if (
        hasAttemptedSubmit ||
        touched.name ||
        touched.email ||
        touched.message
      ) {
        showValidationErrors();
      }

      // Update character count indicator
      updateMessageCharCount();

      const disabled = !isFormValid() || isCooldownActive();
      elements.submitBtn.disabled = !!disabled;

      // Use translation key if available, otherwise use stored default
      const translationKey = elements.submitBtn.dataset.translationKey;
      if (translationKey) {
        // Don't override text - let the translation system handle it
      } else if (elements.submitBtn.dataset.defaultLabel) {
        elements.submitBtn.textContent =
          elements.submitBtn.dataset.defaultLabel;
      }

      updateCooldownDisplay();
    }

    ['input', 'change', 'blur'].forEach(function (ev: string): void {
      elements.nameInput.addEventListener(ev, updateSubmitButtonState);
      elements.emailInput.addEventListener(ev, updateSubmitButtonState);
      // Attach listeners to the editor if present, otherwise to the message input
      try {
        if (elements.messageEditor) {
          // Keep hidden input in sync with the editor so form submission works
          const syncMessage = function (): void {
            try {
              if (elements.hiddenMessageInput) {
                elements.hiddenMessageInput.value =
                  elements.messageEditor!.innerText ||
                  elements.messageEditor!.textContent ||
                  '';
              }
            } catch {
              // noop
            }
            updateSubmitButtonState();
          };
          ['input', 'keyup', 'blur', 'paste'].forEach(function (
            evt: string
          ): void {
            elements.messageEditor!.addEventListener(evt, syncMessage);
          });
          // initialize
          syncMessage();
        } else if (elements.messageInput) {
          elements.messageInput.addEventListener(ev, updateSubmitButtonState);
        }
      } catch {
        // noop
      }
    });

    // Marcar campos como "touched" al salir (blur) para mostrar solo ese error
    try {
      elements.nameInput.addEventListener('blur', function (): void {
        touched.name = true;
        updateSubmitButtonState();
      });
      elements.emailInput.addEventListener('blur', function (): void {
        touched.email = true;
        updateSubmitButtonState();
      });
      if (elements.messageEditor) {
        elements.messageEditor.addEventListener('blur', function (): void {
          touched.message = true;
          updateSubmitButtonState();
        });
      } else if (elements.messageInput) {
        elements.messageInput.addEventListener('blur', function (): void {
          touched.message = true;
          updateSubmitButtonState();
        });
      }
    } catch {}

    updateSubmitButtonState();

    function markSend(): void {
      localStorage.setItem(CONFIG.LAST_SEND_KEY, String(now()));
      updateSubmitButtonState();
    }

    async function handleSubmit(e: Event): Promise<void> {
      e.preventDefault();

      // Marcar que el usuario intentó enviar
      hasAttemptedSubmit = true;

      if (!isFormValid()) {
        // Mostrar errores de validación cuando se intenta enviar
        showValidationErrors();
        updateSubmitButtonState();
        return;
      }
      if (isCooldownActive()) {
        updateSubmitButtonState();
        return;
      }

      // Si llegamos aquí, el formulario es válido - ocultar errores de validación
      hideAllValidationErrors();

      elements.submitBtn.disabled = true;
      const originalText = elements.submitBtn.textContent;

      // Use translation for "Sending..." text
      const lang = document.documentElement.lang || 'ES';
      const sendingText =
        resolveTranslation('contact.sending', lang) || 'Sending...';
      elements.submitBtn.textContent = sendingText;

      try {
        const fd = new FormData(elements.form);
        if (fd.has && fd.has('cf-turnstile-response')) {
          fd.delete('cf-turnstile-response');
        }
        const res = await fetch(elements.form.action || '/api/contact', {
          method: (elements.form.method || 'POST').toUpperCase(),
          body: fd,
          headers: { Accept: 'application/json' },
        });

        if (!res || !res.ok) {
          let text = '';
          try {
            text = await res.text();
          } catch {
            // Ignore text parsing errors
          }
          console.error('Contact send failed', res && res.status, text);
          // show translated error message with status; keep button label stable
          try {
            const code = (res && res.status) || '';
            let tpl =
              resolveTranslation(
                'contact.sendError',
                document.documentElement.lang || 'ES'
              ) || 'An error occurred while sending.';
            if (code) tpl = tpl + ' (' + code + ')';
            showStatus('error', tpl);
          } catch {
            // noop
          }
          // restore button immediately and refresh state; leave status visible for the configured timeout
          elements.submitBtn.textContent = originalText;
          updateSubmitButtonState();
          setTimeout(function (): void {
            clearStatus();
          }, 60000);
          return;
        }

        markSend();
        elements.form.reset();
        // Ocultar errores de validación cuando el formulario se resetea exitosamente
        hideAllValidationErrors();
        // Resetear la bandera para que no aparezcan errores en el próximo uso
        hasAttemptedSubmit = false;
        // show translated success message with status code
        try {
          const okCode = (res && res.status) || '';
          let okTpl =
            resolveTranslation(
              'contact.sentSuccess',
              document.documentElement.lang || 'ES'
            ) || 'Message sent.';
          if (okCode) okTpl = okTpl + ' (' + okCode + ')';
          showStatus('success', okTpl);
        } catch {
          // noop
        }

        // Use translation for "Sent" text
        const sentText = resolveTranslation('contact.sent', lang) || 'Sent';
        elements.submitBtn.textContent = sentText;
        setTimeout(function (): void {
          elements.submitBtn.textContent = originalText;
          updateSubmitButtonState();
          clearStatus();
        }, 60000);
      } catch (err: unknown) {
        console.error('Contact submit error', err);
        try {
          const catchTpl =
            resolveTranslation(
              'contact.sendError',
              document.documentElement.lang || 'ES'
            ) || 'An error occurred while sending.';
          const catchMsg =
            catchTpl +
            (err &&
            typeof err === 'object' &&
            err !== null &&
            'message' in err &&
            typeof (err as Error).message === 'string'
              ? ' (' + (err as Error).message + ')'
              : '');
          showStatus('error', catchMsg);
        } catch {
          // noop
        }
        // restore button immediately and refresh state; leave status visible for the configured timeout
        elements.submitBtn.textContent = originalText;
        updateSubmitButtonState();
        setTimeout(function (): void {
          clearStatus();
        }, 60000);
      }
    }

    elements.form.addEventListener('submit', handleSubmit);

    // Listen for character count updates from CharacterCounter component
    window.addEventListener(
      'characterCountUpdate',
      function (e: CustomEvent): void {
        if (e.detail && e.detail.targetId === 'message-editor') {
          // Update submit button state when character count changes
          updateSubmitButtonState();
        }
      }
    );

    setInterval(updateSubmitButtonState, 1000);
  });
})();
