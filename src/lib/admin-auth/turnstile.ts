import { env } from '../env';
import { verifyTurnstile } from '../contact-security';

export async function verifyAdminTurnstile(
  token: string,
  ip: string
): Promise<boolean> {
  if (!env('TURNSTILE_SECRET_KEY') && import.meta.env.PROD) return false;
  return verifyTurnstile(token, ip);
}
