import type { APIRoute } from 'astro';
import { fail, json } from '../../../../lib/admin-api';
import { listPasskeys } from '../../../../lib/admin-auth/passkeys/repository';

export const GET: APIRoute = async () => {
  try {
    return json({ ok: true, passkeys: await listPasskeys() });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
