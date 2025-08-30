import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL;
// Optional server-side Turnstile secret (keep out of client-visible env)
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const post: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();

    // Honeypot field (must be empty for human submissions)
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
    const cfToken = String(form.get('cf-turnstile-response') || '').trim();

    // Time-trap server-side: if elapsed is under 2.5 seconds, likely a bot
    if (timeSpent && timeSpent < 2500) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Spam detected (fast submit)' }),
        { status: 400 }
      );
    }

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // simple token check: require token to be present
    if (!formToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid form token' }),
        { status: 400 }
      );
    }

    // If Turnstile secret is configured, require and verify the client token
    if (TURNSTILE_SECRET) {
      if (!cfToken) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Captcha token missing' }),
          { status: 400 }
        );
      }

      // verify with Cloudflare Turnstile
      try {
        const params = new URLSearchParams();
        params.append('secret', TURNSTILE_SECRET);
        params.append('response', cfToken);

        const verifyRes = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          }
        );
        const verifyJson = await verifyRes.json();
        if (!verifyJson || verifyJson.success !== true) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Captcha verification failed' }),
            { status: 400 }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: 'Captcha verification error' }),
          { status: 500 }
        );
      }
    }

    // If resend is configured, send email
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

    // fallback: return OK with parsed fields
    return new Response(
      JSON.stringify({ ok: true, data: { name, email, message } }),
      { status: 200 }
    );
  } catch (err) {
    // Log the real error server-side, but do not expose details to the client
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500 }
    );
  }
};

export const prerender = false;
