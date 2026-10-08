// Cambia el usuario del admin (pide la contraseña si pasó mucho desde el login).
import type { APIRoute } from 'astro';
import { isDbConfigured } from '../../../db/client';
import { UserError, fail, json, readBody } from '../../../lib/admin-api';
import { getClientIp } from '../../../lib/admin-auth/client-ip';
import { getAdminUsername } from '../../../lib/admin-auth/credentials';
import { setStoredUsername } from '../../../lib/admin-auth/password-store';
import { requireRecentAuth } from '../../../lib/admin-auth/reauth';
import { logSecurityEvent } from '../../../lib/admin-auth/security-log';
import { normalizeUsername } from '../../../lib/admin-auth/username-policy';

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  if (!isDbConfigured) {
    return json({ ok: false, error: 'La base de datos no está configurada' }, 503);
  }
  try {
    const body = await readBody(request);
    const ip = getClientIp(request, clientAddress);
    await requireRecentAuth(locals.adminSession!, body.password, ip);

    const username = normalizeUsername(String(body.username ?? ''));
    if (!username) {
      throw new UserError(
        'El usuario tiene que tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo'
      );
    }
    if (username === (await getAdminUsername())) {
      throw new UserError('Ese ya es tu usuario');
    }
    await setStoredUsername(username);
    logSecurityEvent('username-changed', { ip });
    return json({ ok: true, username });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
