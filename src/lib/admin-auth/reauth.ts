import { UserError } from '../admin-api';
import { isPasswordValid } from './credentials';
import { ipKey, registerAttempt, resetAttempts } from './rate-limit';
import { IP_FAILURES } from './rate-limit-policy';
import { logSecurityEvent } from './security-log';
import type { AdminSession } from './session';
import { isRecentAuth } from './session-policy';

export async function requireRecentAuth(
  session: AdminSession,
  password: unknown,
  ip: string
): Promise<void> {
  if (isRecentAuth(session.createdAt, Date.now())) return;
  if ((await registerAttempt(ipKey(ip), IP_FAILURES)) > 0) {
    throw new UserError('Demasiados intentos. Probá más tarde.', 429);
  }
  if (typeof password === 'string' && isPasswordValid(password)) {
    await resetAttempts(ipKey(ip));
    return;
  }
  logSecurityEvent('reauth-failed', { ip });
  throw new UserError('Ingresá tu contraseña para continuar', 401);
}
