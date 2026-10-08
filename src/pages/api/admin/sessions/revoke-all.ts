import type { APIRoute } from 'astro';
import { fail, json } from '../../../../lib/admin-api';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import {
  clearSessionCookie,
  revokeAllSessions,
} from '../../../../lib/admin-auth/session';
import { revokeAllTrustedDevices } from '../../../../lib/admin-auth/trusted-device';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    await revokeAllSessions();
    await revokeAllTrustedDevices();
    clearSessionCookie(cookies);
    logSecurityEvent('sessions-revoked-all');
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
