import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  admin2faPending,
  adminRecoveryCodes,
  adminTotp,
  adminTrustedDevices,
} from '../../db/schema';
import { UserError } from '../admin-api';
import {
  generateTotpSecret,
  matchTotp,
  otpauthUri,
} from './totp';
import { env } from '../env';
import { decryptSecret, encryptSecret } from './twofa-crypto';
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
} from './twofa-policy';

const ID = 'admin';
const MIN_KEY_LENGTH = 16;

// Clave para cifrar el secreto TOTP: SESSION_SECRET (openssl rand -hex 32).
function getEncryptionSecret(): string {
  const secret = env('SESSION_SECRET')?.trim();
  if (!secret || secret.length < MIN_KEY_LENGTH) {
    throw new UserError(
      'Falta configurar SESSION_SECRET para usar el 2FA',
      500
    );
  }
  return secret;
}

function requireDb() {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED');
  return db;
}

async function getRow() {
  if (!db) return null;
  const [row] = await db.select().from(adminTotp).where(eq(adminTotp.id, ID));
  return row ?? null;
}

export async function isTwoFactorEnabled(): Promise<boolean> {
  return (await getRow())?.enabled === true;
}

export async function countRecoveryCodesLeft(): Promise<number> {
  if (!db) return 0;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(adminRecoveryCodes)
    .where(isNull(adminRecoveryCodes.usedAt));
  return row?.n ?? 0;
}

// Genera un secreto nuevo (todavía sin activar). Si ya había uno sin confirmar,
// lo reemplaza. Con el 2FA activo no se puede volver a configurar.
export async function beginSetup(account: string, issuer: string) {
  const database = requireDb();
  if (await isTwoFactorEnabled()) {
    throw new UserError('El 2FA ya está activado', 409);
  }
  const secret = generateTotpSecret();
  const secretEnc = encryptSecret(secret, getEncryptionSecret());
  await database
    .insert(adminTotp)
    .values({ id: ID, secretEnc, enabled: false, lastUsedStep: 0 })
    .onConflictDoUpdate({
      target: adminTotp.id,
      set: { secretEnc, enabled: false, lastUsedStep: 0, createdAt: new Date() },
    });
  return { secret, uri: otpauthUri(secret, account, issuer) };
}

// Confirma el alta con un código de la app. Devuelve los códigos de recuperación
// (la única vez que se ven en texto plano) o null si el código no coincide.
export async function confirmSetup(code: string): Promise<string[] | null> {
  const database = requireDb();
  const row = await getRow();
  if (!row || row.enabled) return null;
  const secret = decryptSecret(row.secretEnc, getEncryptionSecret());
  const step = matchTotp(secret, code, Date.now());
  if (step === null) return null;
  const [updated] = await database
    .update(adminTotp)
    .set({ enabled: true, lastUsedStep: step })
    .where(and(eq(adminTotp.id, ID), eq(adminTotp.enabled, false)))
    .returning({ id: adminTotp.id });
  if (!updated) return null;
  return replaceRecoveryCodes();
}

export async function replaceRecoveryCodes(): Promise<string[]> {
  const database = requireDb();
  const codes = generateRecoveryCodes();
  await database.delete(adminRecoveryCodes);
  await database
    .insert(adminRecoveryCodes)
    .values(codes.map((code) => ({ codeHash: hashRecoveryCode(code) })));
  return codes;
}

export async function disableTwoFactor(): Promise<void> {
  const database = requireDb();
  await database.delete(adminTotp);
  await database.delete(adminRecoveryCodes);
  await database.delete(adminTrustedDevices);
  await database.delete(admin2faPending);
}

// Valida el segundo factor: código de la app o código de recuperación.
// Cada código sirve una sola vez (el UPDATE condicional es atómico).
export async function verifySecondFactor(
  input: string
): Promise<'totp' | 'recovery' | null> {
  const database = requireDb();
  const row = await getRow();
  if (!row?.enabled) return null;

  const recovery = normalizeRecoveryCode(input);
  if (recovery) {
    const [used] = await database
      .update(adminRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(adminRecoveryCodes.codeHash, hashRecoveryCode(recovery)),
          isNull(adminRecoveryCodes.usedAt)
        )
      )
      .returning({ id: adminRecoveryCodes.id });
    return used ? 'recovery' : null;
  }

  const secret = decryptSecret(row.secretEnc, getEncryptionSecret());
  const step = matchTotp(secret, input, Date.now(), row.lastUsedStep);
  if (step === null) return null;
  const [claimed] = await database
    .update(adminTotp)
    .set({ lastUsedStep: step })
    .where(and(eq(adminTotp.id, ID), lt(adminTotp.lastUsedStep, step)))
    .returning({ id: adminTotp.id });
  return claimed ? 'totp' : null;
}
