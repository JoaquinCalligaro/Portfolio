import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { adminCredentials } from '../../db/schema';

const ROW_ID = 'admin';

export async function getStoredPasswordHash(): Promise<string | null> {
  if (!db) return null;
  const [row] = await db
    .select({ passwordHash: adminCredentials.passwordHash })
    .from(adminCredentials)
    .where(eq(adminCredentials.id, ROW_ID));
  return row?.passwordHash ?? null;
}

export async function setStoredPasswordHash(passwordHash: string): Promise<void> {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  const updatedAt = new Date();
  await db
    .insert(adminCredentials)
    .values({ id: ROW_ID, passwordHash, updatedAt })
    .onConflictDoUpdate({
      target: adminCredentials.id,
      set: { passwordHash, updatedAt },
    });
}
