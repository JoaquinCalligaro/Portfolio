import type { APIRoute } from 'astro';
import {
  UserError,
  fail,
  json,
  readBody,
  tooManyAttempts,
} from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import {
  lockedForMs,
  registerAttempt,
  resetAttempts,
} from '../../../../lib/admin-auth/rate-limit';
import {
  GLOBAL_FAILURES,
  IP_FAILURES,
} from '../../../../lib/admin-auth/rate-limit-policy';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import {
  TWOFA_GLOBAL_KEY,
  twofaIpKey,
} from '../../../../lib/admin-auth/twofa-policy';
import { confirmSetup } from '../../../../lib/admin-auth/twofa-store';

// Paso 2 del alta: confirma con un código de la app y entrega los códigos de
// recuperación (se muestran una sola vez).
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = getClientIp(request, clientAddress);
    const lockedMs = await lockedForMs([twofaIpKey(ip), TWOFA_GLOBAL_KEY]);
    if (lockedMs > 0) {
      logSecurityEvent('2fa-enable-blocked', { ip, lockedMs });
      throw tooManyAttempts(lockedMs);
    }
    const body = await readBody(request);
    const code = typeof body.code === 'string' ? body.code : '';
    const recoveryCodes = await confirmSetup(code);
    if (!recoveryCodes) {
      const locked = Math.max(
        await registerAttempt(twofaIpKey(ip), IP_FAILURES),
        await registerAttempt(TWOFA_GLOBAL_KEY, GLOBAL_FAILURES)
      );
      logSecurityEvent('2fa-enable-failed', { ip });
      if (locked > 0) throw tooManyAttempts(locked);
      throw new UserError('Código incorrecto. Revisá la hora de tu celular.');
    }
    await resetAttempts(twofaIpKey(ip));
    await resetAttempts(TWOFA_GLOBAL_KEY);
    logSecurityEvent('2fa-enabled', { ip });
    return json({ ok: true, recoveryCodes });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
