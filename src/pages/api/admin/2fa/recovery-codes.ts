import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import { requireRecentAuth } from '../../../../lib/admin-auth/reauth';
import { limitTwoFactorGeneration } from '../../../../lib/admin-auth/twofa-generate-limit';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import {
  isTwoFactorEnabled,
  replaceRecoveryCodes,
} from '../../../../lib/admin-auth/twofa-store';

// Genera 10 códigos nuevos e invalida los anteriores.
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const ip = getClientIp(request, clientAddress);
    const body = await readBody(request);
    await requireRecentAuth(locals.adminSession!, body.password, ip);
    if (!(await isTwoFactorEnabled())) {
      throw new UserError('Primero activá el 2FA', 409);
    }
    await limitTwoFactorGeneration(ip);
    const recoveryCodes = await replaceRecoveryCodes();
    logSecurityEvent('2fa-recovery-regenerated', { ip });
    return json({ ok: true, recoveryCodes });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
