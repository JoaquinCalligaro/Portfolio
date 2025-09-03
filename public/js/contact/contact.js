/* eslint-env browser, es2021 */
/* eslint no-console: 0 */
/* eslint no-empty: 0 */
/* eslint no-unused-vars: 0 */
/* global window, document, localStorage, FormData, fetch, console, setTimeout, setInterval */
// Clean, captcha-free contact client
(function () {
  'use strict';

  var RATE_LIMIT_MS = 1 * 60 * 1000; // 1 minute
  var LAST_SEND_KEY = 'contact:lastSend';

  function qs(sel) {
    return document.querySelector(sel);
  }
  function now() {
    return Date.now();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form =
      qs('#contactForm') ||
      qs('form#contactForm') ||
      qs('form[name="contact"]');
    var nameInput = qs('#name') || qs('input[name="name"]');
    var emailInput = qs('#email') || qs('input[name="email"]');
    // Prefer the rich editor (#message-editor) if present, keep a reference to the hidden input used for submission
    var messageEditor = qs('#message-editor');
    var hiddenMessageInput = qs('#message') || qs('input[name="message"]');
    var messageInput =
      messageEditor || hiddenMessageInput || qs('textarea[name="message"]');
    var submitBtn =
      qs('#submitBtn') || qs('#submit-btn') || qs('button[type="submit"]');

    if (!form || !nameInput || !emailInput || !messageInput || !submitBtn)
      return;
    submitBtn.dataset.defaultLabel =
      submitBtn.textContent || submitBtn.value || 'Send';

    function getLastSend() {
      var v = localStorage.getItem(LAST_SEND_KEY);
      return v ? Number(v) : 0;
    }
    function isCooldownActive() {
      var last = getLastSend();
      return last && now() - last < RATE_LIMIT_MS;
    }
    function timeLeftMs() {
      var last = getLastSend();
      var diff = RATE_LIMIT_MS - (now() - last);
      return diff > 0 ? diff : 0;
    }

    function validateName(v) {
      var t = String(v || '').trim();
      if (!t) return { ok: false };
      if (t.length < 2) return { ok: false };
      if (t.length > 200) return { ok: false };
      return { ok: true };
    }
    function validateEmail(v) {
      var t = String(v || '').trim();
      if (!t) return { ok: false };
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return { ok: re.test(t) };
    }
    function validateMessage(v) {
      // Accept either a DOM node (contenteditable) or a string/value
      var t = '';
      try {
        if (!v && v !== 0) {
          t = '';
        } else if (typeof v === 'string') {
          t = v;
        } else if (v && typeof v.value === 'string') {
          t = v.value;
        } else if (v && typeof v.textContent === 'string') {
          t = v.textContent;
        } else if (v && typeof v.innerText === 'string') {
          t = v.innerText;
        } else {
          t = String(v || '');
        }
      } catch {
        t = String(v || '');
      }

      t = String(t || '').trim();
      if (!t) return { ok: false };
      if (t.length < 5) return { ok: false };
      return { ok: true };
    }
    function isFormValid() {
      // When using a contenteditable editor, prefer reading from the editor; otherwise use the hidden input
      var messageVal = '';
      try {
        if (messageEditor)
          messageVal =
            messageEditor.textContent || messageEditor.innerText || '';
        else if (messageInput && typeof messageInput.value === 'string')
          messageVal = messageInput.value;
        else messageVal = String(messageInput || '');
      } catch {
        messageVal = '';
      }

      return (
        validateName(nameInput.value).ok &&
        validateEmail(emailInput.value).ok &&
        validateMessage(messageVal).ok
      );
    }

    var cooldownDisplay = qs('#cooldown-display');
    var formStatus = qs('#form-status');

    function formatTimeStr(ms) {
      var totalSec = Math.ceil(ms / 1000);
      if (totalSec <= 0) return '0s';
      if (totalSec < 60) return totalSec + 's';
      var mins = Math.floor(totalSec / 60);
      var secs = totalSec % 60;
      return mins + 'm ' + (secs < 10 ? '0' + secs : secs) + 's';
    }

    function resolveTranslation(key, lang) {
      try {
        if (typeof window === 'undefined' || !window.TRANSLATIONS) return null;
        var parts = key.split('.');
        var docLang =
          (typeof document !== 'undefined' &&
            document.documentElement &&
            document.documentElement.lang) ||
          null;
        var value =
          (window.TRANSLATIONS &&
            (window.TRANSLATIONS[lang] || window.TRANSLATIONS[docLang])) ||
          null;
        for (var i = 0; i < parts.length; i++) {
          if (
            !value ||
            typeof value !== 'object' ||
            value[parts[i]] === undefined
          )
            return null;
          value = value[parts[i]];
        }
        return typeof value === 'string' ? value : null;
      } catch {
        return null;
      }
    }

    function updateCooldownDisplay() {
      try {
        if (!cooldownDisplay) return;
        if (!isCooldownActive()) {
          cooldownDisplay.style.display = 'none';
          try {
            cooldownDisplay.classList.add('hidden');
          } catch {}
          return;
        }
        var msLeft = timeLeftMs();
        var timeStr = formatTimeStr(msLeft);
        // Try to use translations if available
        var lang = document.documentElement.lang || 'ES';
        var tpl =
          resolveTranslation('contact.cooldownWait', lang) ||
          resolveTranslation('contact.cooldownWait', 'ES') ||
          'Please wait ${timeStr} before sending another message.';
        var text = tpl
          .replace('${timeStr}', timeStr)
          .replace('${total}', timeStr);
        cooldownDisplay.style.display = '';
        try {
          cooldownDisplay.classList.remove('hidden');
        } catch {}
        cooldownDisplay.textContent = text;
      } catch {
        // noop
      }
    }

    function clearStatus() {
      try {
        if (!formStatus) return;
        formStatus.textContent = '';
        formStatus.style.display = 'none';
        // ensure Tailwind 'hidden' is present so it stays hidden in case CSS overrides display
        formStatus.classList.add('hidden');
        // clear any status marker so the component can decide styling
        try {
          if (formStatus.dataset) delete formStatus.dataset.status;
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    }

    function showStatus(type, text) {
      try {
        if (!formStatus) return;
        formStatus.textContent = text || '';
        // make visible both via style and by removing tailwind 'hidden'
        formStatus.style.display = '';
        formStatus.classList.remove('hidden');
        // Leave styling (text color / border) to the server component / CSS.
        // Signal the desired status type via a data attribute so the component can react if needed.
        try {
          if (formStatus.dataset) formStatus.dataset.status = type || 'info';
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    }

    function updateSubmitButtonState() {
      var disabled = !isFormValid() || isCooldownActive();
      submitBtn.disabled = !!disabled;
      // keep button label stable; cooldown shown in the cooldown display area
      submitBtn.textContent = submitBtn.dataset.defaultLabel;
      // update cooldown display as part of state update
      updateCooldownDisplay();
    }

    ['input', 'change', 'blur'].forEach(function (ev) {
      nameInput.addEventListener(ev, updateSubmitButtonState);
      emailInput.addEventListener(ev, updateSubmitButtonState);
      // Attach listeners to the editor if present, otherwise to the message input
      try {
        if (messageEditor) {
          // Keep hidden input in sync with the editor so form submission works
          var syncMessage = function () {
            try {
              if (hiddenMessageInput)
                hiddenMessageInput.value =
                  messageEditor.innerText || messageEditor.textContent || '';
            } catch {
              // noop
            }
            updateSubmitButtonState();
          };
          ['input', 'keyup', 'blur', 'paste'].forEach(function (evt) {
            messageEditor.addEventListener(evt, syncMessage);
          });
          // initialize
          syncMessage();
        } else if (messageInput) {
          messageInput.addEventListener(ev, updateSubmitButtonState);
        }
      } catch {
        // noop
      }
    });

    updateSubmitButtonState();

    function markSend() {
      localStorage.setItem(LAST_SEND_KEY, String(now()));
      updateSubmitButtonState();
    }

    async function handleSubmit(e) {
      e.preventDefault();
      if (!isFormValid()) {
        updateSubmitButtonState();
        return;
      }
      if (isCooldownActive()) {
        updateSubmitButtonState();
        return;
      }
      submitBtn.disabled = true;
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      try {
        var fd = new FormData(form);
        if (fd.has && fd.has('cf-turnstile-response'))
          fd.delete('cf-turnstile-response');
        var res = await fetch(form.action || '/api/contact', {
          method: (form.method || 'POST').toUpperCase(),
          body: fd,
          headers: { Accept: 'application/json' },
        });
        if (!res || !res.ok) {
          var text = '';
          try {
            text = await res.text();
          } catch {
            // Ignore text parsing errors
          }
          console.error('Contact send failed', res && res.status, text);
          // show translated error message with status; keep button label stable
          try {
            var code = (res && res.status) || '';
            var tpl =
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
          submitBtn.textContent = originalText;
          updateSubmitButtonState();
          setTimeout(function () {
            clearStatus();
          }, 60000);
          return;
        }
        markSend();
        form.reset();
        // show translated success message with status code
        try {
          var okCode = (res && res.status) || '';
          var okTpl =
            resolveTranslation(
              'contact.sentSuccess',
              document.documentElement.lang || 'ES'
            ) || 'Message sent.';
          if (okCode) okTpl = okTpl + ' (' + okCode + ')';
          showStatus('success', okTpl);
        } catch {
          // noop
        }
        submitBtn.textContent = 'Sent';
        setTimeout(function () {
          submitBtn.textContent = originalText;
          updateSubmitButtonState();
          clearStatus();
        }, 60000);
      } catch (err) {
        console.error('Contact submit error', err);
        try {
          var catchTpl =
            resolveTranslation(
              'contact.sendError',
              document.documentElement.lang || 'ES'
            ) || 'An error occurred while sending.';
          var catchMsg =
            catchTpl + (err && err.message ? ' (' + err.message + ')' : '');
          showStatus('error', catchMsg);
        } catch {
          // noop
        }
        // restore button immediately and refresh state; leave status visible for the configured timeout
        submitBtn.textContent = originalText;
        updateSubmitButtonState();
        setTimeout(function () {
          clearStatus();
        }, 60000);
      }
    }

    form.addEventListener('submit', handleSubmit);
    setInterval(updateSubmitButtonState, 1000);
  });
})();
