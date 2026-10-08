import type { APIRoute } from 'astro';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { UserError, fail, json, readBody } from '../../../../../lib/admin-api';
import { logSecurityEvent } from '../../../../../lib/admin-auth/security-log';
import { consumeChallenge } from '../../../../../lib/admin-auth/passkeys/challenges';
import { getPasskeyConfig } from '../../../../../lib/admin-auth/passkeys/config';
import { passkeyUnavailable } from '../../../../../lib/admin-auth/passkeys/errors';
import { verifyRegistration } from '../../../../../lib/admin-auth/passkeys/registration';
import {
  insertPasskey,
  isUniqueViolation,
} from '../../../../../lib/admin-auth/passkeys/repository';
import { registerVerifySchema } from '../../../../../lib/admin-auth/passkeys/schemas';

const FAILED = 'No pudimos registrar la passkey. Probá de nuevo.';

export const POST: APIRoute = async ({ request }) => {
  try {
    const config = getPasskeyConfig(request);
    if (!config) return passkeyUnavailable();

    const parsed = registerVerifySchema.safeParse(await readBody(request));
    if (!parsed.success) throw new UserError(FAILED);

    const challenge = await consumeChallenge(parsed.data.attemptId, 'register');
    if (!challenge) throw new UserError(FAILED);

    const info = await verifyRegistration(
      config,
      parsed.data.response as unknown as RegistrationResponseJSON,
      challenge
    );
    if (!info) throw new UserError(FAILED);

    const stored = await insertPasskey({
      credentialId: info.credential.id,
      publicKey: Buffer.from(info.credential.publicKey).toString('base64url'),
      counter: info.credential.counter,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      transports: info.credential.transports ?? [],
      label: parsed.data.label || 'Mi dispositivo',
    }).catch((err: unknown) => {
      if (isUniqueViolation(err)) {
        throw new UserError('Este dispositivo ya está registrado', 409);
      }
      throw err;
    });
    if (!stored) throw new UserError('Llegaste al máximo de dispositivos', 409);
    logSecurityEvent('passkey-registered');
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
