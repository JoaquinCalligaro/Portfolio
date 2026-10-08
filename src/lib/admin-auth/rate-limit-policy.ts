export type AttemptState = {
  failCount: number;
  windowStart: number;
  lockedUntil: number | null;
  lockLevel: number;
};

export type AttemptConfig = {
  max: number;
  windowMs: number;
  baseLockMs: number;
  maxLockMs: number;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
export const LOCK_QUIET_MS = HOUR;

export const IP_FAILURES: AttemptConfig = {
  max: 5,
  windowMs: 15 * MINUTE,
  baseLockMs: 15 * MINUTE,
  maxLockMs: 24 * HOUR,
};
export const GLOBAL_FAILURES: AttemptConfig = {
  max: 10,
  windowMs: 15 * MINUTE,
  baseLockMs: 15 * MINUTE,
  maxLockMs: HOUR,
};
export const PASSKEY_OPTIONS_HITS: AttemptConfig = {
  max: 10,
  windowMs: MINUTE,
  baseLockMs: MINUTE,
  maxLockMs: MINUTE,
};

// Generar secretos o códigos de recuperación cuenta cada pedido (no solo los
// fallidos) para que un bot no pueda generar códigos sin límite.
export const TWOFA_GENERATE_HITS: AttemptConfig = {
  max: 5,
  windowMs: 15 * MINUTE,
  baseLockMs: 15 * MINUTE,
  maxLockMs: 24 * HOUR,
};

export function applyFailure(
  state: AttemptState | null,
  now: number,
  config: AttemptConfig
): AttemptState {
  const current = state ?? {
    failCount: 0,
    windowStart: now,
    lockedUntil: null,
    lockLevel: 0,
  };
  if (current.lockedUntil !== null && current.lockedUntil > now) return current;
  const expired = now - current.windowStart >= config.windowMs;
  const quiet =
    current.lockedUntil === null || current.lockedUntil < now - LOCK_QUIET_MS;
  const lockLevel = expired && quiet ? 0 : current.lockLevel;
  const failCount = (expired ? 0 : current.failCount) + 1;
  const windowStart = expired ? now : current.windowStart;

  if (failCount < config.max) {
    return { ...current, lockLevel, failCount, windowStart };
  }
  const lockMs = Math.min(
    config.baseLockMs * 2 ** lockLevel,
    config.maxLockMs
  );
  return {
    failCount: 0,
    windowStart: now,
    lockedUntil: now + lockMs,
    lockLevel: lockLevel + 1,
  };
}

export function lockRemainingMs(
  state: Pick<AttemptState, 'lockedUntil'> | null,
  now: number
): number {
  if (!state?.lockedUntil) return 0;
  return Math.max(0, state.lockedUntil - now);
}
