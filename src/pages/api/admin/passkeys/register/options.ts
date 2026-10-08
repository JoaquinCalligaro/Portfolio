import type { APIRoute } from 'astro';
import { UserError, fail, json, readBody } from '../../../../../lib/admin-api';
import { getClientIp } from '../../../../../lib/admin-auth/client-ip';
import { requireRecentAuth } from '../../../../../lib/admin-auth/reauth';
import { getAdminUsername } from '../../../../../lib/admin-auth/credentials';
import { createChallenge } from '../../../../../lib/admin-auth/passkeys/challenges';
import { getPasskeyConfig } from '../../../../../lib/admin-auth/passkeys/config';
import { passkeyUnavailable } from '../../../../../lib/admin-auth/passkeys/errors';
import { buildRegistrationOptions } from '../../../../../lib/admin-auth/passkeys/registration';
import {
  MAX_PASSKEYS,
  countPasskeys,
  listCredentialIds,
} from '../../../../../lib/admin-auth/passkeys/repository';

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const config = getPasskeyConfig(request);
    if (!config) return passkeyUnavailable();

    const body = await readBody(request);
    await requireRecentAuth(
      locals.adminSession!,
      body.password,
      getClientIp(request, clientAddress)
    );

    if ((await countPasskeys()) >= MAX_PASSKEYS) {
      throw new UserError(
        `Llegaste al máximo de ${MAX_PASSKEYS} dispositivos. Eliminá uno antes de registrar otro.`,
        409
      );
    }

    const options = await buildRegistrationOptions(
      config,
      (await getAdminUsername()) || 'admin',
      await listCredentialIds()
    );
    const attemptId = await createChallenge('register', options.challenge);
    return json({ ok: true, attemptId, options });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
