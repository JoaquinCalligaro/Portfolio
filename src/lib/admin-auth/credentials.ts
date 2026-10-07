import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../env';
import { verifyPassword } from '../auth';

const digest = (value: string) => createHash('sha256').update(value).digest();

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function isAdminConfigured(): boolean {
  return Boolean(env('ADMIN_USERNAME') && env('ADMIN_PASSWORD_HASH'));
}

export function isPasswordValid(password: string): boolean {
  return verifyPassword(password, env('ADMIN_PASSWORD_HASH') ?? '');
}

export function areLoginValid(username: string, password: string): boolean {
  const userOk = safeEqual(username, env('ADMIN_USERNAME') ?? '');
  const passwordOk = isPasswordValid(password);
  return userOk && passwordOk;
}
