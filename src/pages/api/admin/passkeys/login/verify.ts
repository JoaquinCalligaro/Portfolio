import type { APIRoute } from 'astro';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { fail, readBody } from '../../../../../lib/admin-api';
import { getClientIp } from '../../../../../lib/admin-auth/client-ip';
import {
  ipKey,
  registerAttempt,
  resetAttempts,
} from '../../../../../lib/admin-auth/rate-limit';
import { IP_FAILURES } from '../../../../../lib/admin-auth/rate-limit-policy';
import { logSecurityEvent } from '../../../../../lib/admin-auth/security-log';
import { createSession } from '../../../../../lib/admin-auth/session';
import { verifyAssertion } from '../../../../../lib/admin-auth/passkeys/authentication';
import { consumeChallenge } from '../../../../../lib/admin-auth/passkeys/challenges';
import { getPasskeyConfig } from '../../../../../lib/admin-auth/passkeys/config';
import {
  passkeyFailure,
  passkeyUnavailable,
} from '../../../../../lib/admin-auth/passkeys/errors';
import {
  findByCredentialId,
  updateCounter,
} from '../../../../../lib/admin-auth/passkeys/repository';
import { loginVerifySchema } from '../../../../../lib/admin-auth/passkeys/schemas';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const config = getPasskeyConfig(request);
    if (!config) return passkeyUnavailable();

    const ip = getClientIp(request, clientAddress);
    if ((await registerAttempt(ipKey(ip), IP_FAILURES)) > 0) {
      return passkeyFailure(429);
    }

    const reject = async (reason: string) => {
      logSecurityEvent('passkey-login-failed', { ip, reason });
      return passkeyFailure();
    };

    const parsed = loginVerifySchema.safeParse(await readBody(request));
    if (!parsed.success) return reject('invalid_body');

    const challenge = await consumeChallenge(parsed.data.attemptId, 'login');
    if (!challenge) return reject('challenge');

    const stored = await findByCredentialId(parsed.data.response.id);
    if (!stored) return reject('unknown_credential');

    const info = await verifyAssertion(
      config,
      parsed.data.response as unknown as AuthenticationResponseJSON,
      challenge,
      stored
    );
    if (!info) return reject('verification');

    await updateCounter(stored.id, info.newCounter);
    await createSession(cookies, request.headers.get('user-agent') ?? '');
    await resetAttempts(ipKey(ip));
    logSecurityEvent('login-ok', { ip, method: 'passkey' });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
