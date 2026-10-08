import type { APIRoute } from 'astro';
import { fail, json } from '../../../lib/admin-api';
import { getClientIp } from '../../../lib/admin-auth/client-ip';
import {
  areLoginValid,
  isAdminConfigured,
} from '../../../lib/admin-auth/credentials';
import {
  GLOBAL_KEY,
  ipKey,
  lockedForMs,
  registerAttempt,
  resetAttempts,
} from '../../../lib/admin-auth/rate-limit';
import {
  GLOBAL_FAILURES,
  IP_FAILURES,
} from '../../../lib/admin-auth/rate-limit-policy';
import { recordLogin } from '../../../lib/admin-auth/login-log';
import { logSecurityEvent } from '../../../lib/admin-auth/security-log';
import { createSession } from '../../../lib/admin-auth/session';
import { isTrustedDevice } from '../../../lib/admin-auth/trusted-device';
import { createPending } from '../../../lib/admin-auth/twofa-pending';
import { isTwoFactorEnabled } from '../../../lib/admin-auth/twofa-store';
import { verifyAdminTurnstile } from '../../../lib/admin-auth/turnstile';

const BAD_LOGIN = 'Usuario o contraseña incorrectos';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    if (!(await isAdminConfigured())) {
      return json(
        {
          ok: false,
          error: 'El panel de admin no está configurado. Corré pnpm admin:init',
        },
        500
      );
    }

    const ip = getClientIp(request, clientAddress);
    let lockedMs = await lockedForMs([ipKey(ip), GLOBAL_KEY]);
    if (lockedMs === 0) {
      lockedMs = Math.max(
        await registerAttempt(ipKey(ip), IP_FAILURES),
        await registerAttempt(GLOBAL_KEY, GLOBAL_FAILURES)
      );
    }
    if (lockedMs > 0) {
      logSecurityEvent('login-blocked', { ip, lockedMs });
      return json(
        {
          ok: false,
          error: 'Demasiados intentos. Probá más tarde.',
          retryAfterSeconds: Math.ceil(lockedMs / 1000),
        },
        429
      );
    }

    const form = await request.formData();
    const username = String(form.get('username') || '').trim();
    const password = String(form.get('password') || '').trim();
    const captcha = String(form.get('cf-turnstile-response') || '');

    if (!(await verifyAdminTurnstile(captcha, ip))) {
      logSecurityEvent('login-captcha-failed', { ip });
      return json({ ok: false, error: 'No se pudo verificar el captcha' }, 400);
    }

    if (!(await areLoginValid(username, password))) {
      logSecurityEvent('login-failed', { ip });
      return json({ ok: false, error: BAD_LOGIN }, 401);
    }

    await resetAttempts(ipKey(ip));
    await resetAttempts(GLOBAL_KEY);

    // Con 2FA activo, un dispositivo nuevo todavía no tiene sesión: falta el código.
    const requires2fa = await isTwoFactorEnabled();
    const trusted = requires2fa && (await isTrustedDevice(cookies));
    if (requires2fa && !trusted) {
      await createPending(cookies);
      logSecurityEvent('login-2fa-required', { ip });
      return json({ ok: true, needs2fa: true });
    }

    await createSession(cookies, request.headers.get('user-agent') ?? '');
    const method = trusted ? 'password+trusted' : 'password';
    await recordLogin(request, ip, method);
    logSecurityEvent('login-ok', { ip, method });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
