import type { APIRoute } from 'astro';
import { fail, json } from '../../../../../lib/admin-api';
import { getClientIp } from '../../../../../lib/admin-auth/client-ip';
import {
  passkeyOptionsKey,
  registerAttempt,
} from '../../../../../lib/admin-auth/rate-limit';
import { PASSKEY_OPTIONS_HITS } from '../../../../../lib/admin-auth/rate-limit-policy';
import { buildAuthenticationOptions } from '../../../../../lib/admin-auth/passkeys/authentication';
import { createChallenge } from '../../../../../lib/admin-auth/passkeys/challenges';
import { getPasskeyConfig } from '../../../../../lib/admin-auth/passkeys/config';
import { passkeyUnavailable } from '../../../../../lib/admin-auth/passkeys/errors';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const config = getPasskeyConfig(request);
    if (!config) return passkeyUnavailable();

    const key = passkeyOptionsKey(getClientIp(request, clientAddress));
    if ((await registerAttempt(key, PASSKEY_OPTIONS_HITS)) > 0) {
      return json({ ok: false, error: 'Demasiados intentos. Probá más tarde.' }, 429);
    }

    const options = await buildAuthenticationOptions(config);
    const attemptId = await createChallenge('login', options.challenge);
    return json({ ok: true, attemptId, options });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
