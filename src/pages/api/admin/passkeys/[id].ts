import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../../lib/admin-api';
import { getClientIp } from '../../../../lib/admin-auth/client-ip';
import { requireRecentAuth } from '../../../../lib/admin-auth/reauth';
import { logSecurityEvent } from '../../../../lib/admin-auth/security-log';
import { deletePasskey, renamePasskey } from '../../../../lib/admin-auth/passkeys/repository';
import { idSchema, renameSchema } from '../../../../lib/admin-auth/passkeys/schemas';

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

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = idSchema.safeParse(params.id);
    if (!id.success) throw new UserError('Passkey no encontrada', 404);

    const body = renameSchema.safeParse(await readBody(request));
    if (!body.success) throw new UserError('Poné un nombre de 1 a 60 caracteres');

    if (!(await renamePasskey(id.data, body.data.label))) {
      throw new UserError('Passkey no encontrada', 404);
    }
    return json({ ok: true, label: body.data.label });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
