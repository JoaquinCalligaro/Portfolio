import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import { requireRecentAuth } from '../../../../lib/admin-auth/reauth';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import { deletePasskey } from '../../../../lib/admin-auth/passkeys/repository';
import { idSchema } from '../../../../lib/admin-auth/passkeys/schemas';

export const DELETE: APIRoute = async ({
  params,
  request,
  locals,
  clientAddress,
}) => {
  try {
    const id = idSchema.safeParse(params.id);
    if (!id.success) throw new UserError('Passkey no encontrada', 404);

    const body = await readBody(request);
    await requireRecentAuth(
      locals.adminSession!,
      body.password,
      getClientIp(request, clientAddress)
    );

    if (!(await deletePasskey(id.data))) {
      throw new UserError('Passkey no encontrada', 404);
    }
    logSecurityEvent('passkey-deleted');
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
