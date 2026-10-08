import { count, desc, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { adminPasskeys } from '../../../db/schema';

export const MAX_PASSKEYS = 5;

function requireDb() {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  return db;
}

export async function listPasskeys() {
  return requireDb()
    .select({
      id: adminPasskeys.id,
      label: adminPasskeys.label,
      backedUp: adminPasskeys.backedUp,
      createdAt: adminPasskeys.createdAt,
      lastUsedAt: adminPasskeys.lastUsedAt,
    })
    .from(adminPasskeys)
    .orderBy(desc(adminPasskeys.createdAt));
}

export async function countPasskeys(): Promise<number> {
  const [row] = await requireDb()
    .select({ total: count() })
    .from(adminPasskeys);
  return row.total;
}

export async function listCredentialIds(): Promise<
  { id: string; transports: string[] }[]
> {
  const rows = await requireDb()
    .select({
      id: adminPasskeys.credentialId,
      transports: adminPasskeys.transports,
    })
    .from(adminPasskeys);
  return rows;
}

export async function findByCredentialId(credentialId: string) {
  const [row] = await requireDb()
    .select()
    .from(adminPasskeys)
    .where(eq(adminPasskeys.credentialId, credentialId));
  return row ?? null;
}

export async function insertPasskey(input: {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports: string[];
  label: string;
}): Promise<boolean> {
  const database = requireDb();
  const [row] = await database
    .insert(adminPasskeys)
    .values({ ...input, lastUsedAt: new Date() })
    .returning({ id: adminPasskeys.id });
  if ((await countPasskeys()) <= MAX_PASSKEYS) return true;
  await database.delete(adminPasskeys).where(eq(adminPasskeys.id, row.id));
  return false;
}

export function isUniqueViolation(err: unknown): boolean {
  const error = err as { code?: string; cause?: { code?: string } };
  return error?.code === '23505' || error?.cause?.code === '23505';
}

export async function updateCounter(
  id: string,
  counter: number
): Promise<void> {
  await requireDb()
    .update(adminPasskeys)
    .set({ counter, lastUsedAt: new Date() })
    .where(eq(adminPasskeys.id, id));
}

export async function renamePasskey(id: string, label: string): Promise<boolean> {
  const rows = await requireDb()
    .update(adminPasskeys)
    .set({ label })
    .where(eq(adminPasskeys.id, id))
    .returning({ id: adminPasskeys.id });
  return rows.length > 0;
}

export async function deletePasskey(id: string): Promise<boolean> {
  const rows = await requireDb()
    .delete(adminPasskeys)
    .where(eq(adminPasskeys.id, id))
    .returning({ id: adminPasskeys.id });
  return rows.length > 0;
}
