import { eq, lt, sql } from 'drizzle-orm';
import type { AstroCookies } from 'astro';
import { db } from '../../db/client';
import { admin2faPending } from '../../db/schema';
import { generateToken, hashToken } from './session-policy';
import {
  PENDING_MAX_FAILS,
  PENDING_TTL_MS,
  isPendingValid,
} from './twofa-policy';

export const PENDING_COOKIE = 'admin_2fa_pending';

function requireDb() {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  return db;
}

// Contraseña correcta, falta el código: se guarda un pase de 5 minutos.
export async function createPending(cookies: AstroCookies): Promise<void> {
  const database = requireDb();
  const now = Date.now();
  const token = generateToken();
  await database
    .delete(admin2faPending)
    .where(lt(admin2faPending.expiresAt, new Date(now)));
  await database.insert(admin2faPending).values({
    tokenHash: hashToken(token),
    expiresAt: new Date(now + PENDING_TTL_MS),
  });
  cookies.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(PENDING_TTL_MS / 1000),
  });
}

export async function getPendingId(cookies: AstroCookies): Promise<string | null> {
  const token = cookies.get(PENDING_COOKIE)?.value;
  if (!token || !db) return null;
  const [row] = await db
    .select()
    .from(admin2faPending)
    .where(eq(admin2faPending.tokenHash, hashToken(token)));
  if (!row) return null;
  const valid = isPendingValid(
    { expiresAt: row.expiresAt.getTime(), failCount: row.failCount },
    Date.now()
  );
  if (!valid) {
    await db.delete(admin2faPending).where(eq(admin2faPending.id, row.id));
    return null;
  }
  return row.id;
}

// Suma un intento fallido; al llegar al máximo el pase se destruye.
export async function registerPendingFailure(id: string): Promise<void> {
  const database = requireDb();
  const [row] = await database
    .update(admin2faPending)
    .set({ failCount: sql`${admin2faPending.failCount} + 1` })
    .where(eq(admin2faPending.id, id))
    .returning({ failCount: admin2faPending.failCount });
  if (row && row.failCount >= PENDING_MAX_FAILS) {
    await database.delete(admin2faPending).where(eq(admin2faPending.id, id));
  }
}

export async function consumePending(
  cookies: AstroCookies,
  id: string
): Promise<void> {
  await requireDb().delete(admin2faPending).where(eq(admin2faPending.id, id));
  cookies.delete(PENDING_COOKIE, { path: '/' });
}
