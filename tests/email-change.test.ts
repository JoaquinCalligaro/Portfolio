import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMAIL_CODE_MAX_FAILS,
  EMAIL_CODE_TTL_MS,
  canResend,
  codesMatch,
  generateEmailCode,
  hashEmailCode,
  isEmailChangeValid,
  maskEmail,
  normalizeCode,
  normalizeEmail,
} from '../src/lib/admin-auth/email-change-policy.ts';
import { normalizeUsername } from '../src/lib/admin-auth/username-policy.ts';

test('generateEmailCode always gives 6 digits', () => {
  for (let i = 0; i < 200; i++) assert.match(generateEmailCode(), /^\d{6}$/);
});

test('hashEmailCode is deterministic and bound to email and code', () => {
  const h = hashEmailCode('123456', 'a@b.com');
  assert.equal(h, hashEmailCode('123456', 'a@b.com'));
  assert.notEqual(h, hashEmailCode('123456', 'c@b.com'));
  assert.notEqual(h, hashEmailCode('654321', 'a@b.com'));
  assert.equal(codesMatch(h, hashEmailCode('123456', 'a@b.com')), true);
  assert.equal(codesMatch(h, hashEmailCode('654321', 'a@b.com')), false);
});

test('normalizeEmail', () => {
  assert.equal(normalizeEmail(' Foo@Gmail.com '), 'foo@gmail.com');
  for (const bad of ['a@b.com\r\nBcc: x', 'a b@c.com', '<a@b.com>', ''])
    assert.equal(normalizeEmail(bad), null);
});

test('normalizeCode', () => {
  assert.equal(normalizeCode(' 123 456 '), '123456');
  assert.equal(normalizeCode('12345'), null);
  assert.equal(normalizeCode('abcdef'), null);
});

test('isEmailChangeValid and canResend', () => {
  const now = 1_000_000;
  assert.equal(isEmailChangeValid({ expiresAt: now - 1, failCount: 0 }, now), false);
  assert.equal(
    isEmailChangeValid({ expiresAt: now + 1, failCount: EMAIL_CODE_MAX_FAILS }, now),
    false
  );
  assert.equal(
    isEmailChangeValid({ expiresAt: now + EMAIL_CODE_TTL_MS, failCount: 0 }, now),
    true
  );
  assert.equal(canResend(now - 59_000, now), false);
  assert.equal(canResend(now - 60_000, now), true);
});

test('maskEmail', () => {
  assert.equal(maskEmail('joaquin@gmail.com'), 'jo***@gmail.com');
});

test('normalizeUsername', () => {
  assert.equal(normalizeUsername('admin'), 'admin');
  assert.equal(normalizeUsername('  Joaquin   Calligaro '), 'Joaquin Calligaro');
  for (const bad of ['ab', 'a<b', 'x'.repeat(33)])
    assert.equal(normalizeUsername(bad), null);
});
