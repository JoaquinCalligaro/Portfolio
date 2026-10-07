// API endpoint para el formulario de contacto
import { env } from '../../lib/env';
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import {
  LIMITS,
  escapeHtml,
  isRateLimited,
  isValidEmail,
  toPlainText,
  toSingleLine,
  verifyTurnstile,
} from '../../lib/contact-security';

// Variables de entorno para el servicio de email
const RESEND_API_KEY = env('RESEND_API_KEY');
const TO_EMAIL = env('CONTACT_TO_EMAIL');

// Cliente de Resend para envío de emails
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Maneja las peticiones POST del formulario de contacto
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const fail = (error: string, status: number) =>
    new Response(JSON.stringify({ ok: false, error }), { status });

  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      clientAddress ||
      'unknown';
    if (isRateLimited(ip)) return fail('Too many requests', 429);

    const form = await request.formData();

    // Campo honeypot para detectar spam (debe estar vacío)
    const website = form.get('website');
    if (website && String(website).trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Spam detected' }),
        { status: 400 }
      );
    }

    const captcha = String(form.get('cf-turnstile-response') || '');
    if (!(await verifyTurnstile(captcha, ip))) return fail('Captcha failed', 400);

    const name = toSingleLine(String(form.get('name') || ''));
    const email = String(form.get('email') || '').trim();
    const message = toPlainText(String(form.get('message') || ''));
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

    if (
      name.length > LIMITS.name ||
      message.length > LIMITS.message ||
      !isValidEmail(email)
    ) {
      return fail('Invalid fields', 400);
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
      const html = `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr/><div style="white-space:pre-wrap">${escapeHtml(message)}</div>`;

      await resendClient.emails.send({
        from: TO_EMAIL,
        to: TO_EMAIL,
        replyTo: email,
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
