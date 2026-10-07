// Endpoint para editar y borrar un proyecto puntual
import type { APIRoute } from 'astro';
import { updateProject, deleteProject } from '../../../../db/queries';
import { isDbConfigured } from '../../../../db/client';
import { notifyProjectsUpdated } from '../../../../lib/pusher-server';

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
    const updated = await updateProject(id, body);
    if (!updated) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Proyecto no encontrado' }),
        { status: 404 }
      );
    }
    await notifyProjectsUpdated();

    return new Response(JSON.stringify({ ok: true, project: updated }), {
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
    await notifyProjectsUpdated();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};

export const prerender = false;
