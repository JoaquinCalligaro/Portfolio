import { json } from '../../admin-api';

export const GENERIC_PASSKEY_ERROR = 'No pudimos validar tu passkey.';

export const passkeyFailure = (status = 401) =>
  json({ ok: false, error: GENERIC_PASSKEY_ERROR }, status);

export const passkeyUnavailable = () =>
  json({ ok: false, error: 'Las passkeys no están configuradas' }, 503);
