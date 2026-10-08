import type { APIRoute } from 'astro';
import { isDbConfigured } from '../../../../db/client';
import { fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import { requestEmailChange } from '../../../../lib/admin-auth/email-change';
import { requireRecentAuth } from '../../../../lib/admin-auth/reauth';

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  if (!isDbConfigured) {
    return json({ ok: false, error: 'La base de datos no está configurada' }, 503);
  }
  try {
    const body = await readBody(request);
    const ip = getClientIp(request, clientAddress);
    await requireRecentAuth(locals.adminSession!, body.password, ip);
    const result = await requestEmailChange(String(body.email ?? ''), ip);
    return json({
      ok: true,
      email: result.email,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
