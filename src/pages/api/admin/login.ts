// Endpoint de login del panel de administración
import type { APIRoute } from 'astro';
import {
  createSessionValue,
  verifyPassword,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const form = await request.formData();
    const username = String(form.get('username') || '').trim();
    const password = String(form.get('password') || '').trim();

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedUsername || !expectedPasswordHash) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'El panel de admin no está configurado en el servidor',
        }),
        { status: 500 }
      );
    }

    if (!username || !password) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Faltan usuario o contraseña' }),
        { status: 400 }
      );
    }

    const validUsername = username === expectedUsername;
    const validPassword = verifyPassword(password, expectedPasswordHash);

    if (!validUsername || !validPassword) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Usuario o contraseña incorrectos' }),
        { status: 401 }
      );
    }

    const sessionValue = createSessionValue(username);
    cookies.set(SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

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
