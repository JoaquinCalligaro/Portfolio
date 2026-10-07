// Endpoint para editar y borrar un proyecto puntual
import type { APIRoute } from 'astro';
import { updateProject, deleteProject } from '../../../../db/queries';
import { isDbConfigured } from '../../../../db/client';
import { notifyProjectsUpdated } from '../../../../lib/pusher-server';
import { translateSafe } from '../../../../lib/translate';

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!isDbConfigured) {
    return new Response(
      JSON.stringify({ ok: false, error: 'La base de datos no está configurada' }),
      { status: 503 }
    );
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Falta el id' }), {
      status: 400,
    });
  }

  try {
    const body = await request.json();
    let warning: string | undefined;

    // El inglés siempre se genera desde el español; nunca se edita a mano.
    delete body.titleEn;
    delete body.descriptionEn;
    if (typeof body.titleEs === 'string') {
      const t = await translateSafe(body.titleEs);
      body.titleEn = t.text;
      warning = t.warning;
    }
    if (typeof body.descriptionEs === 'string') {
      const d = await translateSafe(body.descriptionEs);
      body.descriptionEn = d.text;
      warning = warning ?? d.warning;
    }

    const updated = await updateProject(id, body);
    if (!updated) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Proyecto no encontrado' }),
        { status: 404 }
      );
    }
    const realtime = await notifyProjectsUpdated();

    return new Response(JSON.stringify({ ok: true, project: updated, realtime, warning }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  if (!isDbConfigured) {
    return new Response(
      JSON.stringify({ ok: false, error: 'La base de datos no está configurada' }),
      { status: 503 }
    );
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Falta el id' }), {
      status: 400,
    });
  }

  try {
    await deleteProject(id);
    const realtime = await notifyProjectsUpdated();
    return new Response(JSON.stringify({ ok: true, realtime }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};

export const prerender = false;
