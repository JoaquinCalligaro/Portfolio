// Sirve el certificado (imagen o PDF) de una entrada de Educación.
import type { APIRoute } from 'astro';
import { getEducationCertificate } from '../../../../db/queries';

export const GET: APIRoute = async ({ params }) => {
  try {
    const row = params.id ? await getEducationCertificate(params.id) : null;
    if (!row || row.hidden || !row.data) {
      return new Response('Certificado no encontrado', { status: 404 });
    }
    return new Response(Buffer.from(row.data, 'base64'), {
      headers: {
        'Content-Type': row.mime,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response('Certificado no encontrado', { status: 404 });
  }
};

export const prerender = false;
