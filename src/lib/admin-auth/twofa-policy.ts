import { createHash, randomBytes } from 'node:crypto';

export const PENDING_TTL_MS = 5 * 60 * 1000;
export const PENDING_MAX_FAILS = 5;
export const TRUSTED_DEVICE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const RECOVERY_CODE_COUNT = 10;

// Sin 0/O/1/I/L para que se lean bien al copiarlos a mano.
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const twofaIpKey = (ip: string) => `2fa:ip:${ip}`;
export const TWOFA_GLOBAL_KEY = '2fa:global';
export const twofaGenerateKey = (ip: string) => `2fa:gen:${ip}`;
export const TWOFA_GENERATE_GLOBAL_KEY = '2fa:gen:global';

export function generateRecoveryCode(): string {
  const bytes = randomBytes(10);
  let raw = '';
  for (const byte of bytes) raw += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateRecoveryCode());
  return [...codes];
}

// Acepta mayúsculas/minúsculas, con o sin guion o espacios.
export function normalizeRecoveryCode(input: string): string | null {
  const clean = input.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z0-9]{10}$/.test(clean)) return null;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(`recovery:${code}`).digest('hex');
}

export type PendingTimes = { expiresAt: number; failCount: number };

export function isPendingValid(pending: PendingTimes, now: number): boolean {
  return now < pending.expiresAt && pending.failCount < PENDING_MAX_FAILS;
}

export function isTrustedDeviceValid(expiresAt: number, now: number): boolean {
  return now < expiresAt;
}
