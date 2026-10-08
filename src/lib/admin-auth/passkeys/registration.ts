import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type { PasskeyConfig } from './config';

const ADMIN_USER_ID = new TextEncoder().encode('portfolio-admin');

export function buildRegistrationOptions(
  config: PasskeyConfig,
  userName: string,
  existing: { id: string; transports: string[] }[]
) {
  return generateRegistrationOptions({
    rpID: config.rpID,
    rpName: config.rpName,
    userID: ADMIN_USER_ID,
    userName,
    userDisplayName: userName,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
    excludeCredentials: existing,
  });
}

export async function verifyRegistration(
  config: PasskeyConfig,
  response: RegistrationResponseJSON,
  expectedChallenge: string
) {
  try {
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    });
    return result.verified ? result.registrationInfo : null;
  } catch {
    return null;
  }
}
