// Utilidades compartidas por los endpoints del panel: respuestas JSON, errores
// controlados y fábricas de rutas (listar/crear, editar/borrar, reordenar).
import type { APIRoute } from 'astro';
import { isDbConfigured } from '../db/client';
import { notifySiteUpdated } from './pusher-server';

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Error con mensaje apto para mostrarle al admin (en español).
export class UserError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function fail(err: unknown) {
  if (err instanceof UserError) {
    return json({ ok: false, error: err.message }, err.status);
  }
  console.error(err);
  return json({ ok: false, error: 'Error interno del servidor' }, 500);
}

const dbMissing = () =>
  json({ ok: false, error: 'La base de datos no está configurada' }, 503);

export async function readBody(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // cae en el error de abajo
  }
  throw new UserError('El pedido no es válido');
}

// --- Helpers para limpiar el body ---------------------------------------

export function text(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : undefined;
}

export function flag(body: Record<string, unknown>, key: string) {
  return typeof body[key] === 'boolean' ? (body[key] as boolean) : undefined;
}

export function strings(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (!Array.isArray(value)) return undefined;
  return value.map((v) => String(v).trim()).filter(Boolean);
}

// Quita las claves con valor undefined (campos que no vinieron en el pedido).
export function defined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

export function requireText(value: string | undefined, message: string) {
  if (!value) throw new UserError(message);
  return value;
}

// Links permitidos en las redes: http(s), mailto y tel. Un email suelto se
// convierte en mailto:.
export function safeUrl(value: string) {
  const url = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(value)
    ? `mailto:${value}`
    : value;
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    throw new UserError(
      'El link tiene que empezar con https://, mailto: o tel:'
    );
  }
  return url;
}

// --- Fábricas de rutas -----------------------------------------------------

type Prepared = { data: Record<string, unknown>; warning?: string };
type Body = Record<string, unknown>;

// Avisa a la web pública (Pusher) y arma la respuesta de un cambio exitoso.
async function respond(
  payload: Record<string, unknown>,
  status: number,
  warning?: string
) {
  const realtime = await notifySiteUpdated();
  return json({ ok: true, ...payload, realtime, warning }, status);
}

export function collectionRoutes(config: {
  list: () => Promise<unknown[]>;
  create: (data: any) => Promise<unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any
  prepare: (body: Body, mode: 'create') => Promise<Prepared>;
}): { GET: APIRoute; POST: APIRoute } {
  return {
    GET: async () => {
      if (!isDbConfigured) return dbMissing();
      try {
        return json({ ok: true, items: await config.list() });
      } catch (err) {
        return fail(err);
      }
    },
    POST: async ({ request }) => {
      if (!isDbConfigured) return dbMissing();
      try {
        const { data, warning } = await config.prepare(
          await readBody(request),
          'create'
        );
        const item = await config.create(data);
        return respond({ item }, 201, warning);
      } catch (err) {
        return fail(err);
      }
    },
  };
}

export function itemRoutes(config: {
  update: (id: string, data: any) => Promise<unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any
  remove: (id: string) => Promise<void>;
  prepare: (body: Body, mode: 'update') => Promise<Prepared>;
  // Nombre de la clave en la respuesta (los proyectos usan "project").
  key?: string;
}): { PATCH: APIRoute; DELETE: APIRoute } {
  const key = config.key ?? 'item';
  return {
    PATCH: async ({ params, request }) => {
      if (!isDbConfigured) return dbMissing();
      if (!params.id) return json({ ok: false, error: 'Falta el id' }, 400);
      try {
        const { data, warning } = await config.prepare(
          await readBody(request),
          'update'
        );
        const updated = await config.update(params.id, data);
        if (!updated) return json({ ok: false, error: 'No encontrado' }, 404);
        return respond(
          { [key]: updated, ...(key !== 'item' ? { item: updated } : {}) },
          200,
          warning
        );
      } catch (err) {
        return fail(err);
      }
    },
    DELETE: async ({ params }) => {
      if (!isDbConfigured) return dbMissing();
      if (!params.id) return json({ ok: false, error: 'Falta el id' }, 400);
      try {
        await config.remove(params.id);
        return respond({}, 200);
      } catch (err) {
        return fail(err);
      }
    },
  };
}

export function reorderRoute(reorder: (ids: string[]) => Promise<void>): {
  POST: APIRoute;
} {
  return {
    POST: async ({ request }) => {
      if (!isDbConfigured) return dbMissing();
      try {
        const body = await readBody(request);
        const ids = strings(body, 'ids');
        if (!ids || ids.length === 0)
          throw new UserError('Falta la lista de ids');
        await reorder(ids);
        return respond({}, 200);
      } catch (err) {
        return fail(err);
      }
    },
  };
}
