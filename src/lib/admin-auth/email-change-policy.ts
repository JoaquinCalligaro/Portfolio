// Reglas del cambio de mail de contacto (puro: sin DB ni env, testeable).
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { AttemptConfig } from './rate-limit-policy';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const EMAIL_CODE_TTL_MS = 15 * MINUTE;
export const EMAIL_CODE_MAX_FAILS = 5;
export const EMAIL_RESEND_COOLDOWN_MS = MINUTE;

export const EMAIL_CHANGE_SENDS: AttemptConfig = {
  max: 5,
  windowMs: HOUR,
  baseLockMs: HOUR,
  maxLockMs: 24 * HOUR,
};

export const emailChangeIpKey = (ip: string) => `email-change:ip:${ip}`;

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (email.length > 100 || /[\s<>,;"']/.test(email)) return null;
  return /^[^@]+@[^@]+\.[^@.]{2,}$/.test(email) ? email : null;
}

export function normalizeCode(input: string): string | null {
  const code = input.replace(/\s+/g, '');
  return /^\d{6}$/.test(code) ? code : null;
}

export const generateEmailCode = () =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashEmailCode = (code: string, email: string) =>
  createHash('sha256').update(`email-change:${email}:${code}`).digest('hex');

export function codesMatch(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

export const isEmailChangeValid = (
  row: { expiresAt: Date | number; failCount: number },
  now: number
) =>
  new Date(row.expiresAt).getTime() > now &&
  row.failCount < EMAIL_CODE_MAX_FAILS;

export const canResend = (createdAt: Date | number, now: number) =>
  now - new Date(createdAt).getTime() >= EMAIL_RESEND_COOLDOWN_MS;

export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}
