import { env } from '../../env';

export type PasskeyConfig = {
  rpID: string;
  rpName: string;
  origin: string;
};

export function resolvePasskeyConfig(
  request: Request,
  isProd: boolean
): PasskeyConfig | null {
  const requestUrl = new URL(request.url);
  const rpID = env('PASSKEY_RP_ID')?.trim();
  const origin = env('PASSKEY_ORIGIN')?.trim();
  const rpName = env('PASSKEY_RP_NAME')?.trim() || 'Panel del portfolio';

  if (rpID && origin) return { rpID, rpName, origin };
  if (isProd) return null;
  return { rpID: requestUrl.hostname, rpName, origin: requestUrl.origin };
}

export function getPasskeyConfig(request: Request): PasskeyConfig | null {
  return resolvePasskeyConfig(request, import.meta.env.PROD);
}
