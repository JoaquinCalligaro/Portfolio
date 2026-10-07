// Protege las rutas de administración: sin sesión válida, redirige al login.
import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, verifySessionValue } from './lib/auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const PUBLIC_API_PATHS = ['/api/admin/login'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) {
    return next();
  }

  if (
    PUBLIC_ADMIN_PATHS.includes(pathname) ||
    PUBLIC_API_PATHS.includes(pathname)
  ) {
    return next();
  }

  const cookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = verifySessionValue(cookie);

  if (!isValid) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  return next();
});
