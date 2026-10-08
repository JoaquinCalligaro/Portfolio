import type { APIRoute } from 'astro';
import { fail, json } from '../../../../lib/admin-api';
import { listLogins } from '../../../../lib/admin-auth/login-log';

// Últimos 10 ingresos al panel (IP, ubicación y fecha).
export const GET: APIRoute = async () => {
  try {
    const items = await listLogins();
    return json({
      ok: true,
      items: items.map((row) => ({
        id: row.id,
        ip: row.ip,
        city: row.city,
        region: row.region,
        country: row.country,
        method: row.method,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
