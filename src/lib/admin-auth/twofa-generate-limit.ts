import { tooManyAttempts } from '../admin-api';
import { registerAttempt } from './rate-limit';
import { TWOFA_GENERATE_HITS } from './rate-limit-policy';
import { logSecurityEvent } from './security-log';
import {
  TWOFA_GENERATE_GLOBAL_KEY,
  twofaGenerateKey,
} from './twofa-policy';

// Límite para endpoints que generan secretos o códigos de 2FA: cada pedido
// suma, por IP y global, y al pasarse se congela con bloqueo creciente.
export async function limitTwoFactorGeneration(ip: string): Promise<void> {
  const lockedMs = Math.max(
    await registerAttempt(twofaGenerateKey(ip), TWOFA_GENERATE_HITS),
    await registerAttempt(TWOFA_GENERATE_GLOBAL_KEY, TWOFA_GENERATE_HITS)
  );
  if (lockedMs > 0) {
    logSecurityEvent('2fa-generate-blocked', { ip, lockedMs });
    throw tooManyAttempts(lockedMs);
  }
}
