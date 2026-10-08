// Hash y verificación de la contraseña del admin (scrypt). Las sesiones viven en lib/admin-auth.
import { randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';

// Formato del hash almacenado: "salt:hash" (ambos en hex), generado con scrypt.
export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt ?? randomBytes(16).toString('hex');
  const derived = scryptSync(password, useSalt, 64).toString('hex');
  return `${useSalt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
