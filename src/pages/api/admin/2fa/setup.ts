import type { APIRoute } from 'astro';
import { fail, json, readBody } from '../../../../lib/admin-api';
import { getAdminUsername } from '../../../../lib/admin-auth/credentials';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import { requireRecentAuth } from '../../../../lib/admin-auth/reauth';
import { beginSetup } from '../../../../lib/admin-auth/twofa-store';

// Paso 1 del alta: genera el secreto y devuelve el link para el QR.
// Todavía no queda activo hasta confirmar con un código (enable).
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const body = await readBody(request);
    await requireRecentAuth(
      locals.adminSession!,
      body.password,
      getClientIp(request, clientAddress)
    );
    const setup = await beginSetup((await getAdminUsername()) || 'admin', 'Portfolio admin');
    return json({ ok: true, ...setup });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
