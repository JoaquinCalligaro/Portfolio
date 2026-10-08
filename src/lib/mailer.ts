// Envío de mails con Resend (código de confirmación y avisos del panel).
import { Resend } from 'resend';
import { getProfile } from '../db/queries';
import { env } from './env';

export type MailResult = { ok: true } | { ok: false; error: string };

const DEFAULT_FROM = 'Portfolio <onboarding@resend.dev>';

export function isMailerConfigured(): boolean {
  return Boolean(env('RESEND_API_KEY'));
}

export async function resolveFromEmail(): Promise<string> {
  try {
    return (await getProfile())?.contactFromEmail || DEFAULT_FROM;
  } catch {
    return DEFAULT_FROM;
  }
}

export async function sendMail(o: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<MailResult> {
  const key = env('RESEND_API_KEY');
  if (!key) return { ok: false, error: 'Falta RESEND_API_KEY' };
  try {
    const { error } = await new Resend(key).emails.send({
      from: await resolveFromEmail(),
      to: o.to,
      subject: o.subject,
      html: o.html,
      text: o.text,
    });
    if (error) {
      console.error('[mailer] Resend error:', error);
      return { ok: false, error: error.message ?? 'Error de Resend' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[mailer] Resend error:', err);
    return { ok: false, error: 'Error de Resend' };
  }
}
