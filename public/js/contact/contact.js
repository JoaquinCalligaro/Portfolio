/* eslint-env browser, es2021 */
/* eslint no-console: 0 */
/* eslint no-empty: 0 */
/* eslint no-unused-vars: 0 */
/* global document, localStorage, FormData, fetch, console, setTimeout, setInterval */
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
    var messageInput = qs('#message') || qs('textarea[name="message"]');
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
      var t = String(v || '').trim();
      if (!t) return { ok: false };
      if (t.length < 5) return { ok: false };
      return { ok: true };
    }
    function isFormValid() {
      return (
        validateName(nameInput.value).ok &&
        validateEmail(emailInput.value).ok &&
        validateMessage(messageInput.value).ok
      );
    }

    function updateSubmitButtonState() {
      var disabled = !isFormValid() || isCooldownActive();
      submitBtn.disabled = !!disabled;
      if (isCooldownActive())
        submitBtn.textContent = Math.ceil(timeLeftMs() / 1000) + 's';
      else submitBtn.textContent = submitBtn.dataset.defaultLabel;
    }

    ['input', 'change', 'blur'].forEach(function (ev) {
      nameInput.addEventListener(ev, updateSubmitButtonState);
      emailInput.addEventListener(ev, updateSubmitButtonState);
      messageInput.addEventListener(ev, updateSubmitButtonState);
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
          submitBtn.textContent = 'Error';
          setTimeout(function () {
            submitBtn.textContent = originalText;
            updateSubmitButtonState();
          }, 2000);
          return;
        }
        markSend();
        form.reset();
        submitBtn.textContent = 'Sent';
        setTimeout(function () {
          submitBtn.textContent = originalText;
          updateSubmitButtonState();
        }, 2000);
      } catch (err) {
        console.error('Contact submit error', err);
        submitBtn.textContent = 'Error';
        setTimeout(function () {
          submitBtn.textContent = originalText;
          updateSubmitButtonState();
        }, 2000);
      }
    }

    form.addEventListener('submit', handleSubmit);
    setInterval(updateSubmitButtonState, 1000);
  });
})();
