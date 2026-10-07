// Perfil del sitio (fila única): nombre, presentación, foto, CV y bio.
import type { APIRoute } from 'astro';
import { getProfile, upsertProfile } from '../../../db/queries';
import { isDbConfigured } from '../../../db/client';
import { notifySiteUpdated } from '../../../lib/pusher-server';
import { translateFields } from '../../../lib/translate';
import {
  defined,
  fail,
  json,
  readBody,
  strings,
  text,
} from '../../../lib/admin-api';

export const GET: APIRoute = async () => {
  if (!isDbConfigured) {
    return json(
      { ok: false, error: 'La base de datos no está configurada' },
      503
    );
  }
  try {
    return json({ ok: true, profile: await getProfile() });
  } catch (err) {
    return fail(err);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!isDbConfigured) {
    return json(
      { ok: false, error: 'La base de datos no está configurada' },
      503
    );
  }
  try {
    const body = await readBody(request);
    const fields = defined({
      name: text(body, 'name'),
      headlineEs: text(body, 'headlineEs'),
      photoUrl: text(body, 'photoUrl'),
      cvUrl: text(body, 'cvUrl'),
      bioEs: strings(body, 'bioEs'),
    });

    // Los párrafos que ya estaban traducidos no se vuelven a traducir (si la
    // traducción había fallado, el inglés quedó igual al español y se reintenta).
    const current = await getProfile();
    const reuse = new Map<string, string>();
    current?.bioEs.forEach((es, i) => {
      if (current.bioEn[i] && current.bioEn[i] !== es)
        reuse.set(es, current.bioEn[i]);
    });

    const { data, warning } = await translateFields(
      fields,
      ['headlineEs', 'bioEs'],
      reuse
    );
    const profile = await upsertProfile({ ...fields, ...data });
    const realtime = await notifySiteUpdated();
    return json({ ok: true, profile, realtime, warning });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
