import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../lib/admin-api';
import { hashPassword } from '../../../lib/auth';
import { getClientIp } from '../../../lib/admin-auth/client-ip';
import {
  getAdminUsername,
  isPasswordValid,
} from '../../../lib/admin-auth/credentials';
import { evaluatePassword } from '../../../lib/admin-auth/password-strength';
import { setStoredPasswordHash } from '../../../lib/admin-auth/password-store';
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
import { logSecurityEvent } from '../../../lib/admin-auth/security-log';
import {
  createSession,
  revokeAllSessions,
} from '../../../lib/admin-auth/session';
import { revokeAllTrustedDevices } from '../../../lib/admin-auth/trusted-device';

const BAD_CURRENT = 'La contraseña actual es incorrecta';

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const tooMany = (lockedMs: number) =>
  json(
    {
      ok: false,
      error: 'Demasiados intentos. Probá más tarde.',
      retryAfterSeconds: Math.ceil(lockedMs / 1000),
    },
    429
  );

export const POST: APIRoute = async ({
  request,
  cookies,
  clientAddress,
}) => {
  try {
    const body = await readBody(request);
    // El login recorta la contraseña, así que la actual se recorta igual.
    const currentPassword = asString(body.currentPassword).trim();
    const newPassword = asString(body.newPassword);
    const confirmPassword = asString(body.confirmPassword);

    if (!currentPassword) throw new UserError('Ingresá tu contraseña actual');
    if (newPassword !== confirmPassword) {
      throw new UserError('Las contraseñas nuevas no coinciden');
    }
    const strength = evaluatePassword(newPassword, {
      username: (await getAdminUsername()) || undefined,
    });
    if (!strength.acceptable) {
      throw new UserError(strength.problem ?? 'La contraseña nueva es demasiado débil');
    }
    if (newPassword === currentPassword) {
      throw new UserError('La contraseña nueva tiene que ser distinta de la actual');
    }

    // Mismas protecciones de fuerza bruta que el login: bloqueo por IP y global.
    const ip = getClientIp(request, clientAddress);
    let lockedMs = await lockedForMs([ipKey(ip), GLOBAL_KEY]);
    if (lockedMs === 0) {
      lockedMs = Math.max(
        await registerAttempt(ipKey(ip), IP_FAILURES),
        await registerAttempt(GLOBAL_KEY, GLOBAL_FAILURES)
      );
    }
    if (lockedMs > 0) {
      logSecurityEvent('password-change-blocked', { ip, lockedMs });
      return tooMany(lockedMs);
    }

    if (!(await isPasswordValid(currentPassword))) {
      logSecurityEvent('password-change-failed', { ip });
      return json({ ok: false, error: BAD_CURRENT }, 400);
    }

    await setStoredPasswordHash(hashPassword(newPassword));
    // La contraseña cambió: se cierran todas las sesiones y se abre una nueva
    // solo para este dispositivo.
    await revokeAllSessions();
    await revokeAllTrustedDevices();
    await createSession(cookies, request.headers.get('user-agent') ?? '');
    await resetAttempts(ipKey(ip));
    await resetAttempts(GLOBAL_KEY);
    logSecurityEvent('password-changed', { ip });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
