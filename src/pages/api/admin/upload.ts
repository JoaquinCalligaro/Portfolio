// Endpoint para subir archivos a Cloudinary.
//   ?kind=image (por defecto) | raw (PDF del CV)
//   ?folder=assets para fotos, íconos y CV (por defecto: imágenes de proyectos)
import type { APIRoute } from 'astro';
import {
  ASSETS_FOLDER,
  PROJECTS_FOLDER,
  uploadToCloudinary,
} from '../../../lib/cloudinary';
import { fail, json } from '../../../lib/admin-api';

const MAX_BYTES = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const kind = url.searchParams.get('kind') === 'raw' ? 'raw' : 'image';
    const folder =
      kind === 'raw' || url.searchParams.get('folder') === 'assets'
        ? ASSETS_FOLDER
        : PROJECTS_FOLDER;

    const form = await request.formData();
    const file = form.get('file');

    if (!file || !(file instanceof File)) {
      return json({ ok: false, error: 'Falta el archivo' }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ ok: false, error: 'El archivo supera los 10 MB' }, 400);
    }
    if (kind === 'image' && !file.type.startsWith('image/')) {
      return json(
        { ok: false, error: 'El archivo tiene que ser una imagen' },
        400
      );
    }
    if (kind === 'raw' && file.type !== 'application/pdf') {
      return json({ ok: false, error: 'El CV tiene que ser un PDF' }, 400);
    }

    const uploaded = await uploadToCloudinary(file, { kind, folder });
    return json({ ok: true, url: uploaded }, 200);
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
