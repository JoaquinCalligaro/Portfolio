import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import {
  lockedForMs,
  registerAttempt,
  resetAttempts,
} from '../../../../lib/admin-auth/rate-limit';
import { IP_FAILURES } from '../../../../lib/admin-auth/rate-limit-policy';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import { twofaIpKey } from '../../../../lib/admin-auth/twofa-policy';
import { confirmSetup } from '../../../../lib/admin-auth/twofa-store';

// Paso 2 del alta: confirma con un código de la app y entrega los códigos de
// recuperación (se muestran una sola vez).
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = getClientIp(request, clientAddress);
    if ((await lockedForMs([twofaIpKey(ip)])) > 0) {
      throw new UserError('Demasiados intentos. Probá más tarde.', 429);
    }
    const body = await readBody(request);
    const code = typeof body.code === 'string' ? body.code : '';
    const recoveryCodes = await confirmSetup(code);
    if (!recoveryCodes) {
      await registerAttempt(twofaIpKey(ip), IP_FAILURES);
      throw new UserError('Código incorrecto. Revisá la hora de tu celular.');
    }
    await resetAttempts(twofaIpKey(ip));
    logSecurityEvent('2fa-enabled', { ip });
    return json({ ok: true, recoveryCodes });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
