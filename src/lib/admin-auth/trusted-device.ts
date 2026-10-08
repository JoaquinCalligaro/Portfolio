import { desc, eq, lt } from 'drizzle-orm';
import type { AstroCookies } from 'astro';
import { db } from '../../db/client';
import { adminTrustedDevices } from '../../db/schema';
import { generateToken, hashToken } from './session-policy';
import { TRUSTED_DEVICE_TTL_MS, isTrustedDeviceValid } from './twofa-policy';

export const TRUSTED_DEVICE_COOKIE = 'admin_trusted_device';

function requireDb() {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  return db;
}

export async function createTrustedDevice(
  cookies: AstroCookies,
  userAgent: string
): Promise<void> {
  const database = requireDb();
  const now = Date.now();
  const token = generateToken();
  await database
    .delete(adminTrustedDevices)
    .where(lt(adminTrustedDevices.expiresAt, new Date(now)));
  await database.insert(adminTrustedDevices).values({
    tokenHash: hashToken(token),
    userAgent: userAgent.slice(0, 200),
    expiresAt: new Date(now + TRUSTED_DEVICE_TTL_MS),
  });
  cookies.set(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(TRUSTED_DEVICE_TTL_MS / 1000),
  });
}

// ¿Este navegador ya pasó el 2FA antes? Si es así, el login no pide el código.
export async function isTrustedDevice(cookies: AstroCookies): Promise<boolean> {
  const token = cookies.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!token || !db) return false;
  const [row] = await db
    .select()
    .from(adminTrustedDevices)
    .where(eq(adminTrustedDevices.tokenHash, hashToken(token)));
  if (!row) return false;
  const now = Date.now();
  if (!isTrustedDeviceValid(row.expiresAt.getTime(), now)) {
    await db.delete(adminTrustedDevices).where(eq(adminTrustedDevices.id, row.id));
    return false;
  }
  await db
    .update(adminTrustedDevices)
    .set({ lastUsedAt: new Date(now) })
    .where(eq(adminTrustedDevices.id, row.id));
  return true;
}

export async function currentTrustedDeviceId(
  cookies: AstroCookies
): Promise<string | null> {
  const token = cookies.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!token || !db) return null;
  const [row] = await db
    .select({ id: adminTrustedDevices.id })
    .from(adminTrustedDevices)
    .where(eq(adminTrustedDevices.tokenHash, hashToken(token)));
  return row?.id ?? null;
}

export async function listTrustedDevices() {
  if (!db) return [];
  return db
    .select({
      id: adminTrustedDevices.id,
      userAgent: adminTrustedDevices.userAgent,
      createdAt: adminTrustedDevices.createdAt,
      lastUsedAt: adminTrustedDevices.lastUsedAt,
      expiresAt: adminTrustedDevices.expiresAt,
    })
    .from(adminTrustedDevices)
    .orderBy(desc(adminTrustedDevices.lastUsedAt));
}

export async function revokeTrustedDevice(id: string): Promise<void> {
  await requireDb()
    .delete(adminTrustedDevices)
    .where(eq(adminTrustedDevices.id, id));
}

export async function revokeAllTrustedDevices(): Promise<void> {
  await requireDb().delete(adminTrustedDevices);
}
