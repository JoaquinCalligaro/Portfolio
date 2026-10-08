import { and, eq, lt } from 'drizzle-orm';
import { db } from '../../../db/client';
import { adminWebauthnChallenges } from '../../../db/schema';

export type PasskeyFlow = 'register' | 'login';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function createChallenge(
  flow: PasskeyFlow,
  challenge: string
): Promise<string> {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  const now = Date.now();
  await db
    .delete(adminWebauthnChallenges)
    .where(lt(adminWebauthnChallenges.expiresAt, new Date(now)));
  const [row] = await db
    .insert(adminWebauthnChallenges)
    .values({ flow, challenge, expiresAt: new Date(now + CHALLENGE_TTL_MS) })
    .returning({ id: adminWebauthnChallenges.id });
  return row.id;
}

export async function consumeChallenge(
  attemptId: string,
  flow: PasskeyFlow
): Promise<string | null> {
  if (!db) return null;
  const [row] = await db
    .delete(adminWebauthnChallenges)
    .where(
      and(
        eq(adminWebauthnChallenges.id, attemptId),
        eq(adminWebauthnChallenges.flow, flow)
      )
    )
    .returning();
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return row.challenge;
}
