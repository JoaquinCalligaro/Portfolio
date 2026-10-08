import type { APIRoute } from 'astro';
import { fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import {
  GLOBAL_KEY,
  ipKey,
  lockedForMs,
  registerAttempt,
  resetAttempts,
} from '../../../../lib/admin-auth/rate-limit';
import {
  GLOBAL_FAILURES,
  IP_FAILURES,
} from '../../../../lib/admin-auth/rate-limit-policy';
import { recordLogin } from '../../../../lib/admin-auth/login-log';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import { createSession } from '../../../../lib/admin-auth/session';
import { createTrustedDevice } from '../../../../lib/admin-auth/trusted-device';
import {
  consumePending,
  getPendingId,
  registerPendingFailure,
} from '../../../../lib/admin-auth/twofa-pending';
import {
  TWOFA_GLOBAL_KEY,
  twofaIpKey,
} from '../../../../lib/admin-auth/twofa-policy';
import { verifySecondFactor } from '../../../../lib/admin-auth/twofa-store';

const EXPIRED = 'La verificación venció. Volvé a ingresar tu contraseña.';

const tooMany = (lockedMs: number) =>
  json(
    {
      ok: false,
      error: 'Demasiados intentos. Probá más tarde.',
      retryAfterSeconds: Math.ceil(lockedMs / 1000),
    },
    429
  );

// Segundo paso del login: la contraseña ya fue validada en /api/admin/login
// (eso dejó una cookie temporal). Acá se valida el código y recién entonces
// se crea la sesión.
export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const ip = getClientIp(request, clientAddress);
    const lockedMs = await lockedForMs([twofaIpKey(ip), TWOFA_GLOBAL_KEY]);
    if (lockedMs > 0) {
      logSecurityEvent('2fa-blocked', { ip, lockedMs });
      return tooMany(lockedMs);
    }

    const pendingId = await getPendingId(cookies);
    if (!pendingId) return json({ ok: false, error: EXPIRED, expired: true }, 401);

    const body = await readBody(request);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const trust = body.trust === true;

    const method = code ? await verifySecondFactor(code) : null;
    if (!method) {
      await registerPendingFailure(pendingId);
      const locked = Math.max(
        await registerAttempt(twofaIpKey(ip), IP_FAILURES),
        await registerAttempt(TWOFA_GLOBAL_KEY, GLOBAL_FAILURES)
      );
      logSecurityEvent('2fa-failed', { ip });
      if (locked > 0) return tooMany(locked);
      if (!(await getPendingId(cookies))) {
        return json({ ok: false, error: EXPIRED, expired: true }, 401);
      }
      return json({ ok: false, error: 'Código incorrecto' }, 401);
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    await consumePending(cookies, pendingId);
    await createSession(cookies, userAgent);
    if (trust) await createTrustedDevice(cookies, userAgent);
    await resetAttempts(ipKey(ip));
    await resetAttempts(GLOBAL_KEY);
    await resetAttempts(twofaIpKey(ip));
    await resetAttempts(TWOFA_GLOBAL_KEY);
    await recordLogin(request, ip, `password+${method}`);
    logSecurityEvent('login-ok', { ip, method: `password+${method}`, trust });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
