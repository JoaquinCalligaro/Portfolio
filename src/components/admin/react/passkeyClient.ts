import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { request, type ApiResult } from './api';

const CANCELLED = 'Cancelaste el proceso. Probá de nuevo cuando quieras.';
const GENERIC = 'No pudimos completar la operación con tu dispositivo.';

export const supportsPasskeys = () => browserSupportsWebAuthn();

function describeError(err: unknown) {
  if (err instanceof Error && err.name === 'NotAllowedError') return CANCELLED;
  return GENERIC;
}

export async function loginWithPasskey(): Promise<ApiResult> {
  const start = await request('/api/admin/passkeys/login/options', 'POST', {});
  if (!start.ok) return start;
  try {
    const response = await startAuthentication({
      optionsJSON: start.options as PublicKeyCredentialRequestOptionsJSON,
    });
    return await request('/api/admin/passkeys/login/verify', 'POST', {
      attemptId: start.attemptId,
      response,
    });
  } catch (err) {
    return { ok: false, status: 0, error: describeError(err) };
  }
}

export async function registerPasskey(
  label: string,
  password?: string
): Promise<ApiResult> {
  const start = await request('/api/admin/passkeys/register/options', 'POST', {
    password,
  });
  if (!start.ok) return start;
  try {
    const response = await startRegistration({
      optionsJSON: start.options as PublicKeyCredentialCreationOptionsJSON,
    });
    return await request('/api/admin/passkeys/register/verify', 'POST', {
      attemptId: start.attemptId,
      response,
      label,
    });
  } catch (err) {
    return { ok: false, status: 0, error: describeError(err) };
  }
}
