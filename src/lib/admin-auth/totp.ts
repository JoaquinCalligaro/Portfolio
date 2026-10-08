import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// TOTP (RFC 6238): HMAC-SHA1, 6 dígitos, pasos de 30 s. Es lo que usan
// Google Authenticator, Authy, 1Password, etc.
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
// Se aceptan el paso anterior y el siguiente por si el reloj del celular se desfasa.
export const TOTP_WINDOW = 1;

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error('INVALID_BASE32');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// 160 bits, el largo recomendado para HMAC-SHA1.
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function currentStep(now: number): number {
  return Math.floor(now / 1000 / TOTP_STEP_SECONDS);
}

export function hotp(secret: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(message).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function totpAt(secretBase32: string, now: number): string {
  return hotp(base32Decode(secretBase32), currentStep(now));
}

// Devuelve el paso que coincide con el código, o null. Con `lastUsedStep` se
// descartan pasos ya usados (un mismo código no sirve dos veces).
export function matchTotp(
  secretBase32: string,
  code: string,
  now: number,
  lastUsedStep = 0
): number | null {
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = base32Decode(secretBase32);
  const expected = Buffer.from(clean);
  const center = currentStep(now);
  let match: number | null = null;
  for (let step = center - TOTP_WINDOW; step <= center + TOTP_WINDOW; step++) {
    if (step <= lastUsedStep) continue;
    const candidate = Buffer.from(hotp(secret, step));
    if (timingSafeEqual(candidate, expected)) match = step;
  }
  return match;
}

export function otpauthUri(
  secretBase32: string,
  account: string,
  issuer: string
): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const query = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
