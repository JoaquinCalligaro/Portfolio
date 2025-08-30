import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL;

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

    // Time-trap server-side: if elapsed is under 2 seconds, likely a bot
    if (timeSpent && timeSpent < 2000) {
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

    // collect attachments if any
    const attachments: Array<{
      name: string;
      data: Uint8Array;
      type?: string;
    }> = [];
    for (const entry of form.entries()) {
      const [key, value] = entry as [string, FormDataEntryValue];
      if (
        key === 'attachments' &&
        value &&
        typeof (value as File).arrayBuffer === 'function'
      ) {
        const file = value as File;
        const buf = await file.arrayBuffer();
        attachments.push({
          name: file.name || 'attachment',
          data: new Uint8Array(buf),
          type: file.type,
        });
      }
    }

    // If resend is configured, send email
    if (resendClient && TO_EMAIL) {
      const subject = `Nuevo mensaje de ${name}`;
      const html = `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><hr/><div>${message}</div>`;

      // build attachments payload for resend if any (Resend expects file data as base64)
      const resendAttachments = attachments.map((a) => ({
        filename: a.name,
        // Resend's API accepts a `data` property that's an ArrayBuffer or base64 string depending on SDK
        // We'll send as base64
        data: Buffer.from(a.data).toString('base64'),
        content_type: a.type || 'application/octet-stream',
      }));

      await resendClient.emails.send({
        from: TO_EMAIL,
        to: TO_EMAIL,
        subject,
        html,
        attachments: resendAttachments.length ? resendAttachments : undefined,
      });

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // fallback: return OK with parsed fields
    return new Response(
      JSON.stringify({
        ok: true,
        data: { name, email, message, attachments: attachments.length },
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
    });
  }
};

export const prerender = false;
