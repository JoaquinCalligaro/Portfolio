// Configuración del formulario de contacto: mail de destino y remitente.
import type { APIRoute } from 'astro';
import { getProfile, upsertProfile } from '../../../db/queries';
import { isDbConfigured } from '../../../db/client';
import { UserError, defined, fail, json, readBody, text } from '../../../lib/admin-api';
import { isValidEmail } from '../../../lib/contact-security';

const dbMissing = () =>
  json({ ok: false, error: 'La base de datos no está configurada' }, 503);

export const GET: APIRoute = async () => {
  if (!isDbConfigured) return dbMissing();
  try {
    const profile = await getProfile();
    return json({
      ok: true,
      contactToEmail: profile?.contactToEmail ?? '',
      contactFromEmail: profile?.contactFromEmail ?? '',
    });
  } catch (err) {
    return fail(err);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!isDbConfigured) return dbMissing();
  try {
    const body = await readBody(request);
    const to = text(body, 'contactToEmail');
    const from = text(body, 'contactFromEmail');

    if (to && !isValidEmail(to)) {
      throw new UserError('El mail de destino no es válido');
    }
    // El remitente puede ser "Nombre <mail@dominio.com>" o solo el mail.
    if (from) {
      const address = from.match(/<([^>]+)>$/)?.[1] ?? from;
      if (!isValidEmail(address) || /[\r\n]/.test(from)) {
        throw new UserError('El remitente no es válido');
      }
    }

    await upsertProfile(
      defined({ contactToEmail: to, contactFromEmail: from })
    );
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
