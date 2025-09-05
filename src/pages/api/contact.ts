// API endpoint para el formulario de contacto
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Variables de entorno para el servicio de email
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL;

// Cliente de Resend para envío de emails
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Maneja las peticiones POST del formulario de contacto
export const post: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();

    // Campo honeypot para detectar spam (debe estar vacío)
    const website = form.get('website');
    if (website && String(website).trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Spam detected' }),
        { status: 400 }
      );
    }

    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    const formToken = String(form.get('form_token') || '').trim();
    const timeSpent = Number(form.get('time_spent') || 0);

    // Protección anti-bot: rechazar si se envía muy rápido (menos de 2.5 segundos)
    if (timeSpent && timeSpent < 2500) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Spam detected (fast submit)' }),
        { status: 400 }
      );
    }

    // Validación de campos obligatorios
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Verificación de token del formulario
    if (!formToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid form token' }),
        { status: 400 }
      );
    }

    // Envía email si Resend está configurado
    if (resendClient && TO_EMAIL) {
      const subject = `Nuevo mensaje de ${name}`;
      const html = `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><hr/><div>${message}</div>`;

      await resendClient.emails.send({
        from: TO_EMAIL,
        to: TO_EMAIL,
        subject,
        html,
      });

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Respuesta de fallback sin envío de email
    return new Response(
      JSON.stringify({ ok: true, data: { name, email, message } }),
      { status: 200 }
    );
  } catch (err) {
    // Log del error real en servidor, sin exponer detalles al cliente
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

// Desactiva prerenderizado para permitir POST requests
export const prerender = false;
