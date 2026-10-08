import type { APIRoute } from 'astro';
import { isDbConfigured } from '../../../../db/client';
import { fail, json } from '../../../../lib/admin-api';
import {
  cancelEmailChange,
  getCurrentContactEmail,
  isContactEmailVerified,
  getPendingEmailChange,
} from '../../../../lib/admin-auth/email-change';
import { isMailerConfigured } from '../../../../lib/mailer';

const dbMissing = () =>
  json({ ok: false, error: 'La base de datos no está configurada' }, 503);

export const GET: APIRoute = async () => {
  if (!isDbConfigured) return dbMissing();
  try {
    const pending = await getPendingEmailChange();
    return json({
      ok: true,
      current: await getCurrentContactEmail(),
      verified: await isContactEmailVerified(),
      mailerConfigured: isMailerConfigured(),
      pending: pending
        ? { email: pending.newEmail, expiresAt: pending.expiresAt.toISOString() }
        : null,
    });
  } catch (err) {
    return fail(err);
  }
};

export const DELETE: APIRoute = async () => {
  if (!isDbConfigured) return dbMissing();
  try {
    await cancelEmailChange();
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
