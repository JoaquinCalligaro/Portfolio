// Endpoint para subir una imagen de proyecto a Cloudinary
import type { APIRoute } from 'astro';
import { uploadImageToCloudinary } from '../../../lib/cloudinary';

export const post: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Falta el archivo' }),
        { status: 400 }
      );
    }

    const url = await uploadImageToCloudinary(file);
    return new Response(JSON.stringify({ ok: true, url }), { status: 200 });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Error interno';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
    });
  }
};

export const prerender = false;
