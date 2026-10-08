import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
} from '@simplewebauthn/server';
import type { PasskeyConfig } from './config';

export function buildAuthenticationOptions(config: PasskeyConfig) {
  return generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: 'required',
  });
}

export async function verifyAssertion(
  config: PasskeyConfig,
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  stored: {
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
  }
) {
  try {
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
      credential: {
        id: stored.credentialId,
        publicKey: Buffer.from(stored.publicKey, 'base64url'),
        counter: stored.counter,
        transports: stored.transports as AuthenticatorTransport[],
      },
    });
    return result.verified ? result.authenticationInfo : null;
  } catch {
    return null;
  }
}
