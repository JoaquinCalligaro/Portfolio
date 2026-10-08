import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  base32Decode,
  base32Encode,
  currentStep,
  generateTotpSecret,
  hotp,
  matchTotp,
  otpauthUri,
  totpAt,
} from '../src/lib/admin-auth/totp.ts';
import { decryptSecret, encryptSecret } from '../src/lib/admin-auth/twofa-crypto.ts';
import {
  PENDING_MAX_FAILS,
  RECOVERY_CODE_COUNT,
  generateRecoveryCodes,
  hashRecoveryCode,
  isPendingValid,
  isTrustedDeviceValid,
  normalizeRecoveryCode,
} from '../src/lib/admin-auth/twofa-policy.ts';

const RFC_SECRET = Buffer.from('12345678901234567890');
const RFC_BASE32 = base32Encode(RFC_SECRET);

test('hotp matches RFC 6238 SHA1 vectors (last 6 digits)', () => {
  assert.equal(hotp(RFC_SECRET, currentStep(59_000)), '287082');
  assert.equal(hotp(RFC_SECRET, currentStep(1111111109_000)), '081804');
  assert.equal(hotp(RFC_SECRET, currentStep(1234567890_000)), '005924');
  assert.equal(hotp(RFC_SECRET, currentStep(2000000000_000)), '279037');
});

test('base32 round-trips and ignores spaces/case', () => {
  const secret = generateTotpSecret();
  assert.equal(base32Encode(base32Decode(secret)), secret);
  assert.deepEqual(base32Decode(RFC_BASE32.toLowerCase().replace(/(.{4})/g, '$1 ')), RFC_SECRET);
  assert.throws(() => base32Decode('abc1!'));
});

test('matchTotp accepts ±1 step and rejects the rest', () => {
  const now = 1_700_000_000_000;
  const code = totpAt(RFC_BASE32, now);
  assert.equal(matchTotp(RFC_BASE32, code, now), currentStep(now));
  assert.equal(matchTotp(RFC_BASE32, code, now + 30_000), currentStep(now));
  assert.equal(matchTotp(RFC_BASE32, code, now - 30_000), currentStep(now));
  assert.equal(matchTotp(RFC_BASE32, code, now + 120_000), null);
  assert.equal(matchTotp(RFC_BASE32, 'abcdef', now), null);
  assert.equal(matchTotp(RFC_BASE32, '12345', now), null);
});

test('matchTotp rejects a step that was already used (replay)', () => {
  const now = 1_700_000_000_000;
  const code = totpAt(RFC_BASE32, now);
  const step = matchTotp(RFC_BASE32, code, now);
  assert.notEqual(step, null);
  assert.equal(matchTotp(RFC_BASE32, code, now, step!), null);
});

test('otpauth uri carries secret, issuer and account', () => {
  const uri = otpauthUri('ABC234', 'joaquin', 'Portfolio');
  assert.ok(uri.startsWith('otpauth://totp/Portfolio:joaquin?'));
  assert.ok(uri.includes('secret=ABC234'));
  assert.ok(uri.includes('issuer=Portfolio'));
});

test('secret encryption round-trips and fails with another key or tampering', () => {
  const key = 'a-very-long-session-secret-value';
  const enc = encryptSecret('JBSWY3DPEHPK3PXP', key);
  assert.equal(decryptSecret(enc, key), 'JBSWY3DPEHPK3PXP');
  assert.notEqual(enc, encryptSecret('JBSWY3DPEHPK3PXP', key));
  assert.throws(() => decryptSecret(enc, 'another-secret-value-123456'));
  const [iv, tag, data] = enc.split('.');
  const flipped = (data[0] === 'A' ? 'B' : 'A') + data.slice(1);
  assert.throws(() => decryptSecret([iv, tag, flipped].join('.'), key));
});

test('recovery codes are unique, normalizable and hash consistently', () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, RECOVERY_CODE_COUNT);
  assert.equal(new Set(codes).size, RECOVERY_CODE_COUNT);
  for (const code of codes) {
    assert.match(code, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    assert.equal(normalizeRecoveryCode(code.toLowerCase().replace('-', ' ')), code);
    assert.equal(hashRecoveryCode(code), hashRecoveryCode(code));
  }
  assert.equal(normalizeRecoveryCode('123456'), null);
  assert.equal(normalizeRecoveryCode('abc'), null);
});

test('pending login expires and locks after too many failures', () => {
  const now = 1_000_000;
  assert.equal(isPendingValid({ expiresAt: now + 1, failCount: 0 }, now), true);
  assert.equal(isPendingValid({ expiresAt: now, failCount: 0 }, now), false);
  assert.equal(
    isPendingValid({ expiresAt: now + 1000, failCount: PENDING_MAX_FAILS }, now),
    false
  );
});

test('trusted device validity follows expiry', () => {
  assert.equal(isTrustedDeviceValid(2000, 1000), true);
  assert.equal(isTrustedDeviceValid(1000, 1000), false);
});
