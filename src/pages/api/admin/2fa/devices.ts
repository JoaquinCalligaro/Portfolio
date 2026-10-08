import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../../lib/admin-api';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import {
  revokeAllTrustedDevices,
  revokeTrustedDevice,
} from '../../../../lib/admin-auth/trusted-device';

// Olvidar un dispositivo de confianza ({ id }) o todos ({ all: true }):
// la próxima vez que entren van a tener que poner el código.
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await readBody(request);
    if (body.all === true) {
      await revokeAllTrustedDevices();
    } else if (typeof body.id === 'string' && body.id) {
      await revokeTrustedDevice(body.id);
    } else {
      throw new UserError('Falta el dispositivo');
    }
    logSecurityEvent('2fa-devices-revoked', { all: body.all === true });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
