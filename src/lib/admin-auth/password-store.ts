import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { adminCredentials } from '../../db/schema';

const ID = 'admin';

export async function getStoredCredentials(): Promise<{
  username: string;
  passwordHash: string;
} | null> {
  if (!db) return null;
  const rows = await db
    .select({
      username: adminCredentials.username,
      passwordHash: adminCredentials.passwordHash,
    })
    .from(adminCredentials)
    .where(eq(adminCredentials.id, ID));
  return rows[0] ?? null;
}

export async function getStoredPasswordHash(): Promise<string | null> {
  return (await getStoredCredentials())?.passwordHash ?? null;
}

// Solo actualiza: sin fila no hay admin (se crea con `pnpm admin:init`).
async function updateCredentials(
  data: Partial<{ username: string; passwordHash: string }>
) {
  if (!db) throw new Error('DB_NOT_CONFIGURED');
  const rows = await db
    .update(adminCredentials)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adminCredentials.id, ID))
    .returning({ id: adminCredentials.id });
  if (rows.length === 0) throw new Error('ADMIN_NOT_INITIALIZED');
}

export const setStoredPasswordHash = (passwordHash: string) =>
  updateCredentials({ passwordHash });

export const setStoredUsername = (username: string) =>
  updateCredentials({ username });
