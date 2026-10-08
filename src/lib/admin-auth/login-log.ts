import { desc, notInArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { adminLoginLog } from '../../db/schema';

export const LOGIN_LOG_LIMIT = 10;

// Vercel manda la ubicación aproximada de la IP en estos headers (sin librerías).
function geoHeader(request: Request, name: string): string {
  const value = request.headers.get(name) ?? '';
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

// Guarda el ingreso y borra los que quedan fuera de los últimos 10.
// Si falla no corta el login: el historial es solo informativo.
export async function recordLogin(
  request: Request,
  ip: string,
  method: string
): Promise<void> {
  if (!db) return;
  try {
    await db.insert(adminLoginLog).values({
      ip: ip.slice(0, 64),
      city: geoHeader(request, 'x-vercel-ip-city'),
      region: geoHeader(request, 'x-vercel-ip-country-region'),
      country: geoHeader(request, 'x-vercel-ip-country'),
      method,
    });
    const keep = db
      .select({ id: adminLoginLog.id })
      .from(adminLoginLog)
      .orderBy(desc(adminLoginLog.createdAt))
      .limit(LOGIN_LOG_LIMIT);
    await db.delete(adminLoginLog).where(notInArray(adminLoginLog.id, keep));
  } catch (err) {
    console.error('login-log', err);
  }
}

export async function listLogins() {
  if (!db) return [];
  return db
    .select()
    .from(adminLoginLog)
    .orderBy(desc(adminLoginLog.createdAt))
    .limit(LOGIN_LOG_LIMIT);
}
