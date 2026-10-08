import { createHash, randomBytes } from 'node:crypto';

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_MAX_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_RENEW_AFTER_MS = 5 * 60 * 1000;
export const RECENT_AUTH_MS = 10 * 60 * 1000;

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function initialExpiry(now: number): number {
  return now + SESSION_TTL_MS;
}

export type SessionTimes = {
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
};

export function evaluateSession(
  session: SessionTimes,
  now: number
): { valid: false } | { valid: true; renewTo: number | null } {
  if (now >= session.expiresAt) return { valid: false };
  if (now - session.createdAt >= SESSION_ABSOLUTE_MAX_MS) return { valid: false };
  if (now - session.lastSeenAt < SESSION_RENEW_AFTER_MS) {
    return { valid: true, renewTo: null };
  }
  const renewTo = Math.min(
    now + SESSION_TTL_MS,
    session.createdAt + SESSION_ABSOLUTE_MAX_MS
  );
  return { valid: true, renewTo };
}

export function isRecentAuth(createdAt: number, now: number): boolean {
  return now - createdAt < RECENT_AUTH_MS;
}
