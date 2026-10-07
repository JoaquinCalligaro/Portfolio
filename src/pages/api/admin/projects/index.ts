// Endpoint para listar y crear proyectos
import type { APIRoute } from 'astro';
import { listProjects, createProject } from '../../../../db/queries';
import { isDbConfigured } from '../../../../db/client';
import { notifyProjectsUpdated } from '../../../../lib/pusher-server';
import { translateSafe } from '../../../../lib/translate';

export const GET: APIRoute = async () => {
  if (!isDbConfigured) {
    return new Response(
      JSON.stringify({ ok: false, error: 'La base de datos no está configurada' }),
      { status: 503 }
    );
  }
  const rows = await listProjects();
  return new Response(JSON.stringify({ ok: true, projects: rows }), {
    status: 200,
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!isDbConfigured) {
    return new Response(
      JSON.stringify({ ok: false, error: 'La base de datos no está configurada' }),
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      titleEs,
      descriptionEs,
      repo,
      live,
      technologies,
      images,
      featured,
      hidden,
      position,
    } = body;

    if (!titleEs || !descriptionEs) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Faltan campos obligatorios' }),
        { status: 400 }
      );
    }

    const [title, description] = await Promise.all([
      translateSafe(titleEs),
      translateSafe(descriptionEs),
    ]);
    const warning = title.warning ?? description.warning;

    const created = await createProject({
      titleEs,
      titleEn: title.text,
      descriptionEs,
      descriptionEn: description.text,
      repo: repo ?? '',
      live: live ?? '',
      technologies: Array.isArray(technologies) ? technologies : [],
      images: Array.isArray(images) ? images : [],
      featured: Boolean(featured),
      hidden: Boolean(hidden),
      position: typeof position === 'number' ? position : 0,
    });

    const realtime = await notifyProjectsUpdated();

    return new Response(JSON.stringify({ ok: true, project: created, realtime, warning }), {
      status: 201,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};

export const prerender = false;
