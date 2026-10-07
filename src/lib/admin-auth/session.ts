import { eq, lt } from 'drizzle-orm';
import type { AstroCookies } from 'astro';
import { db } from '../../db/client';
import { adminSessions } from '../../db/schema';
import {
  evaluateSession,
  generateToken,
  hashToken,
  initialExpiry,
  SESSION_ABSOLUTE_MAX_MS,
} from './session-policy';

export const SESSION_COOKIE_NAME = 'admin_session';

export type AdminSession = { id: string; createdAt: number };

function requireDb() {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  return db;
}

export function setSessionCookie(cookies: AstroCookies, token: string): void {
  cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(SESSION_ABSOLUTE_MAX_MS / 1000),
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export async function createSession(
  cookies: AstroCookies,
  userAgent: string
): Promise<void> {
  const database = requireDb();
  const now = Date.now();
  const token = generateToken();
  await database
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, new Date(now)));
  await database.insert(adminSessions).values({
    tokenHash: hashToken(token),
    expiresAt: new Date(initialExpiry(now)),
    lastSeenAt: new Date(now),
    userAgent: userAgent.slice(0, 200),
  });
  setSessionCookie(cookies, token);
}

export async function validateSession(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token || !db) return null;
  const [row] = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.tokenHash, hashToken(token)));
  if (!row) return null;

  const now = Date.now();
  const verdict = evaluateSession(
    {
      createdAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
      lastSeenAt: row.lastSeenAt.getTime(),
    },
    now
  );
  if (!verdict.valid) {
    await db.delete(adminSessions).where(eq(adminSessions.id, row.id));
    return null;
  }
  if (verdict.renewTo !== null) {
    await db
      .update(adminSessions)
      .set({ lastSeenAt: new Date(now), expiresAt: new Date(verdict.renewTo) })
      .where(eq(adminSessions.id, row.id));
  }
  return { id: row.id, createdAt: row.createdAt.getTime() };
}

export async function revokeSessionByToken(
  token: string | undefined
): Promise<void> {
  if (!token || !db) return;
  await db
    .delete(adminSessions)
    .where(eq(adminSessions.tokenHash, hashToken(token)));
}

export async function revokeAllSessions(): Promise<void> {
  await requireDb().delete(adminSessions);
}
