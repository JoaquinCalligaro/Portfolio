// Autenticación simple para el panel de administración (sin tabla de usuarios).
// El usuario y el hash de la contraseña viven en variables de entorno.
import { createHmac, timingSafeEqual, scryptSync } from 'node:crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET no está configurada');
  }
  return secret;
}

// Formato del hash almacenado: "salt:hash" (ambos en hex), generado con scrypt.
export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt ?? randomSaltHex();
  const derived = scryptSync(password, useSalt, 64).toString('hex');
  return `${useSalt}:${derived}`;
}

function randomSaltHex(): string {
  return createHmac('sha256', Math.random().toString())
    .update(Date.now().toString())
    .digest('hex')
    .slice(0, 32);
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('hex');
}

export function createSessionValue(username: string): string {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [username, expires, signature] = parts;
  const payload = `${username}.${expires}`;
  const expectedSignature = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return false;
  if (Date.now() > Number(expires)) return false;
  return true;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;
