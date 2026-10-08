import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { getProfile, upsertProfile } from '../../db/queries';
import { adminEmailChange } from '../../db/schema';
import { UserError } from '../admin-api';
import { escapeHtml } from '../contact-security';
import { isMailerConfigured, sendMail } from '../mailer';
import {
  EMAIL_CHANGE_SENDS,
  EMAIL_CODE_MAX_FAILS,
  EMAIL_CODE_TTL_MS,
  canResend,
  codesMatch,
  emailChangeIpKey,
  generateEmailCode,
  hashEmailCode,
  isEmailChangeValid,
  maskEmail,
  normalizeCode,
  normalizeEmail,
} from './email-change-policy';
import { registerAttempt } from './rate-limit';
import { logSecurityEvent } from './security-log';

const ID = 'admin';

function requireDb() {
  if (!db) throw new UserError('La base de datos no está configurada', 503);
  return db;
}

export async function getCurrentContactEmail(): Promise<string> {
  return (await getProfile())?.contactToEmail ?? '';
}

export async function isContactEmailVerified(): Promise<boolean> {
  return (await getProfile())?.contactToEmailVerified ?? false;
}

async function deletePending() {
  await requireDb().delete(adminEmailChange).where(eq(adminEmailChange.id, ID));
}

async function readPending() {
  const rows = await requireDb()
    .select()
    .from(adminEmailChange)
    .where(eq(adminEmailChange.id, ID));
  return rows[0] ?? null;
}

export async function getPendingEmailChange() {
  const row = await readPending();
  if (!row) return null;
  if (!isEmailChangeValid(row, Date.now())) {
    await deletePending();
    return null;
  }
  return row;
}

export async function requestEmailChange(input: string, ip: string) {
  if (!isMailerConfigured()) {
    throw new UserError(
      'Falta configurar RESEND_API_KEY en las variables de entorno',
      503
    );
  }
  const email = normalizeEmail(input);
  if (!email) throw new UserError('El mail no es válido');
  const current = (await getCurrentContactEmail()).toLowerCase();
  // Si el actual todavía no está verificado, se puede pedir código para el mismo mail.
  if (email === current && (await isContactEmailVerified())) {
    throw new UserError('Ese mail ya está verificado');
  }

  const now = Date.now();
  const pending = await getPendingEmailChange();
  if (pending && !canResend(pending.createdAt, now)) {
    throw new UserError('Esperá un minuto antes de pedir otro código', 429);
  }
  if ((await registerAttempt(emailChangeIpKey(ip), EMAIL_CHANGE_SENDS)) > 0) {
    throw new UserError('Demasiados envíos. Probá más tarde', 429);
  }

  const code = generateEmailCode();
  const safeCode = escapeHtml(code);
  const sent = await sendMail({
    to: email,
    subject: `Tu código de confirmación: ${code}`,
    html: `<p>Tu código para confirmar el nuevo mail de contacto es:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${safeCode}</p><p>Vence en 15 minutos.</p><p>Si no pediste este cambio, ignorá este correo.</p>`,
    text: `Tu código para confirmar el nuevo mail de contacto es: ${code}\nVence en 15 minutos.\nSi no pediste este cambio, ignorá este correo.`,
  });
  if ('error' in sent) {
    throw new UserError(`No se pudo enviar el correo: ${sent.error}`, 502);
  }

  const expiresAt = new Date(now + EMAIL_CODE_TTL_MS);
  const values = {
    newEmail: email,
    codeHash: hashEmailCode(code, email),
    failCount: 0,
    expiresAt,
    createdAt: new Date(now),
  };
  await requireDb()
    .insert(adminEmailChange)
    .values({ id: ID, ...values })
    .onConflictDoUpdate({ target: adminEmailChange.id, set: values });
  logSecurityEvent('email-change-requested', { ip });
  return { email, expiresAt };
}

export async function confirmEmailChange(input: string): Promise<string> {
  const row = await getPendingEmailChange();
  if (!row) throw new UserError('El código venció. Pedí uno nuevo', 410);

  const code = normalizeCode(input);
  if (!code || !codesMatch(row.codeHash, hashEmailCode(code, row.newEmail))) {
    await requireDb()
      .update(adminEmailChange)
      .set({ failCount: sql`${adminEmailChange.failCount} + 1` })
      .where(eq(adminEmailChange.id, ID));
    if (row.failCount + 1 >= EMAIL_CODE_MAX_FAILS) await deletePending();
    throw new UserError('Código incorrecto');
  }

  const old = await getCurrentContactEmail();
  await upsertProfile({
    contactToEmail: row.newEmail,
    contactToEmailVerified: true,
  });
  await deletePending();
  logSecurityEvent('email-changed');

  // Aviso al mail anterior (si falla, no importa)
  if (old && old.toLowerCase() !== row.newEmail) {
    try {
      const masked = maskEmail(row.newEmail);
      await sendMail({
        to: old,
        subject: 'Se cambió el mail de contacto de tu portfolio',
        html: `<p>El mail de contacto de tu portfolio ahora es <strong>${escapeHtml(masked)}</strong>.</p><p>Si no fuiste vos, entrá al panel y revisá tu seguridad.</p>`,
        text: `El mail de contacto de tu portfolio ahora es ${masked}.\nSi no fuiste vos, entrá al panel y revisá tu seguridad.`,
      });
    } catch {
      // best-effort
    }
  }
  return row.newEmail;
}

export async function cancelEmailChange() {
  await deletePending();
}
