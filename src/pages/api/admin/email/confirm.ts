import type { APIRoute } from 'astro';
import { isDbConfigured } from '../../../../db/client';
import { fail, json, readBody } from '../../../../lib/admin-api';
import { confirmEmailChange } from '../../../../lib/admin-auth/email-change';

export const POST: APIRoute = async ({ request }) => {
  if (!isDbConfigured) {
    return json({ ok: false, error: 'La base de datos no está configurada' }, 503);
  }
  try {
    const body = await readBody(request);
    const email = await confirmEmailChange(String(body.code ?? ''));
    return json({ ok: true, email });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
