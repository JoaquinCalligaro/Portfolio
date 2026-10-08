import type { APIRoute } from 'astro';
import { fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import { requireRecentAuth } from '../../../../lib/admin-auth/reauth';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import { disableTwoFactor } from '../../../../lib/admin-auth/twofa-store';

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const ip = getClientIp(request, clientAddress);
    const body = await readBody(request);
    await requireRecentAuth(locals.adminSession!, body.password, ip);
    await disableTwoFactor();
    logSecurityEvent('2fa-disabled', { ip });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
