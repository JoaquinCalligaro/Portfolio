import { defineMiddleware } from 'astro:middleware';
import { json } from './lib/admin-api';
import { hasValidOrigin } from './lib/admin-auth/origin';
import { logSecurityEvent } from './lib/admin-auth/security-log';
import { SESSION_COOKIE_NAME, validateSession } from './lib/admin-auth/session';

const PUBLIC_PATHS = new Set([
  '/admin/login',
  '/api/admin/login',
  '/api/admin/passkeys/login/options',
  '/api/admin/passkeys/login/verify',
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!pathname.startsWith('/admin') && !isAdminApi) return next();

  if (isAdminApi && !hasValidOrigin(context.request, context.url)) {
    logSecurityEvent('origin-rejected', { path: pathname });
    return json({ ok: false, error: 'Origen no permitido' }, 403);
  }

  if (PUBLIC_PATHS.has(pathname)) return next();

  const session = await validateSession(
    context.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  if (!session) {
    if (isAdminApi) return json({ ok: false, error: 'No autorizado' }, 401);
    return context.redirect('/admin/login');
  }

  context.locals.adminSession = session;
  return next();
});
