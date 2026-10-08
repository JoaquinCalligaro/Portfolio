import { createHash, timingSafeEqual } from 'node:crypto';
import { verifyPassword } from '../auth';
import { getStoredCredentials } from './password-store';

const digest = (value: string) => createHash('sha256').update(value).digest();

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export async function getAdminUsername(): Promise<string> {
  return (await getStoredCredentials())?.username ?? '';
}

export async function isAdminConfigured(): Promise<boolean> {
  const row = await getStoredCredentials();
  return Boolean(row?.username && row?.passwordHash);
}

export async function isPasswordValid(password: string): Promise<boolean> {
  const row = await getStoredCredentials();
  return verifyPassword(password, row?.passwordHash ?? '');
}

export async function areLoginValid(
  username: string,
  password: string
): Promise<boolean> {
  const row = await getStoredCredentials();
  // Se calculan ambos (sin cortocircuito) para no filtrar tiempos.
  const userOk = safeEqual(username, row?.username ?? '');
  const passwordOk = verifyPassword(password, row?.passwordHash ?? '');
  return userOk && passwordOk;
}
