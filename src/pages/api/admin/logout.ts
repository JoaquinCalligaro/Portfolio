import type { APIRoute } from 'astro';
import { fail, json } from '../../../lib/admin-api';
import {
  clearSessionCookie,
  revokeSessionByToken,
  SESSION_COOKIE_NAME,
} from '../../../lib/admin-auth/session';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    await revokeSessionByToken(cookies.get(SESSION_COOKIE_NAME)?.value);
    clearSessionCookie(cookies);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
