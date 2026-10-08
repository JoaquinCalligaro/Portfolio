import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../env';
import { verifyPassword } from '../auth';
import { getStoredPasswordHash } from './password-store';

const digest = (value: string) => createHash('sha256').update(value).digest();

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

// El hash guardado desde el panel manda; el de la variable de entorno es el inicial.
async function currentPasswordHash(): Promise<string> {
  return (await getStoredPasswordHash()) ?? env('ADMIN_PASSWORD_HASH') ?? '';
}

export async function isAdminConfigured(): Promise<boolean> {
  return Boolean(env('ADMIN_USERNAME') && (await currentPasswordHash()));
}

export async function isPasswordValid(password: string): Promise<boolean> {
  return verifyPassword(password, await currentPasswordHash());
}

export async function areLoginValid(
  username: string,
  password: string
): Promise<boolean> {
  const userOk = safeEqual(username, env('ADMIN_USERNAME') ?? '');
  const passwordOk = await isPasswordValid(password);
  return userOk && passwordOk;
}
