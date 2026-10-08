import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { adminAuthAttempts } from '../../db/schema';
import {
  LOCK_QUIET_MS,
  lockRemainingMs,
  type AttemptConfig,
  type AttemptState,
} from './rate-limit-policy';

export const ipKey = (ip: string) => `ip:${ip}`;
export const GLOBAL_KEY = 'user:global';
export const passkeyOptionsKey = (ip: string) => `pk-options:${ip}`;

type Row = typeof adminAuthAttempts.$inferSelect;

function toState(row: Row): AttemptState {
  return {
    failCount: row.failCount,
    windowStart: row.windowStart.getTime(),
    lockedUntil: row.lockedUntil ? row.lockedUntil.getTime() : null,
    lockLevel: row.lockLevel,
  };
}

export async function lockedForMs(keys: string[]): Promise<number> {
  if (!db) return 0;
  const rows = await db
    .select()
    .from(adminAuthAttempts)
    .where(inArray(adminAuthAttempts.key, keys));
  const now = Date.now();
  return rows.reduce(
    (max, row) => Math.max(max, lockRemainingMs(toState(row), now)),
    0
  );
}

const ms = (value: number) =>
  sql`(${value}::double precision * interval '1 millisecond')`;

export async function registerAttempt(
  key: string,
  config: AttemptConfig
): Promise<number> {
  if (!db) return 0;
  const c = adminAuthAttempts;
  const expired = sql`(now() - ${c.windowStart} >= ${ms(config.windowMs)})`;
  const locked = sql`(${c.lockedUntil} > now())`;
  const level = sql`(CASE WHEN ${expired} AND (${c.lockedUntil} IS NULL OR ${c.lockedUntil} < now() - ${ms(LOCK_QUIET_MS)}) THEN 0 ELSE ${c.lockLevel} END)`;
  const count = sql`((CASE WHEN ${expired} THEN 0 ELSE ${c.failCount} END) + 1)`;
  const trips = sql`(${count} >= ${config.max})`;
  const lockFor = sql`(LEAST(${config.baseLockMs}::double precision * power(2, ${level}), ${config.maxLockMs}::double precision) * interval '1 millisecond')`;

  const [row] = await db
    .insert(c)
    .values({
      key,
      failCount: 1,
      windowStart: sql`now()`,
      lockedUntil: null,
      lockLevel: 0,
    })
    .onConflictDoUpdate({
      target: c.key,
      set: {
        failCount: sql`CASE WHEN ${locked} THEN ${c.failCount} WHEN ${trips} THEN 0 ELSE ${count} END`,
        windowStart: sql`CASE WHEN ${locked} THEN ${c.windowStart} WHEN ${trips} OR ${expired} THEN now() ELSE ${c.windowStart} END`,
        lockedUntil: sql`CASE WHEN ${locked} THEN ${c.lockedUntil} WHEN ${trips} THEN now() + ${lockFor} ELSE ${c.lockedUntil} END`,
        lockLevel: sql`CASE WHEN ${locked} THEN ${c.lockLevel} WHEN ${trips} THEN ${level} + 1 ELSE ${level} END`,
        version: sql`${c.version} + 1`,
      },
    })
    .returning({ lockedUntil: c.lockedUntil });

  if (!row?.lockedUntil) return 0;
  return Math.max(0, row.lockedUntil.getTime() - Date.now());
}

export async function resetAttempts(key: string): Promise<void> {
  if (!db) return;
  await db.delete(adminAuthAttempts).where(eq(adminAuthAttempts.key, key));
}
