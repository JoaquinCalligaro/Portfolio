import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePassword } from '../src/lib/admin-auth/password-strength.ts';

test('empty password is very weak and not acceptable', () => {
  const result = evaluatePassword('');
  assert.equal(result.score, 0);
  assert.equal(result.acceptable, false);
});

test('short passwords are rejected and capped at weak', () => {
  const result = evaluatePassword('Ab1!xY');
  assert.ok(result.score <= 1);
  assert.equal(result.acceptable, false);
  assert.match(result.problem ?? '', /al menos 12/);
});

test('common words are rejected even with leet substitutions', () => {
  for (const pw of ['Passw0rd!2025xx', 'MiContraseña-2025!', 'pa$$word-Zk9#Lm']) {
    const result = evaluatePassword(pw);
    assert.equal(result.acceptable, false, pw);
    assert.ok(result.score <= 1, pw);
  }
});

test('sequences and repeats are rejected', () => {
  assert.equal(evaluatePassword('Zk9#abcdLm2$Qx').acceptable, false);
  assert.equal(evaluatePassword('Zk9#Lm2$QxZZZZ').acceptable, false);
});

test('password containing the username is rejected', () => {
  const result = evaluatePassword('Joaquin-Zk9#Lm2$', { username: 'joaquin' });
  assert.equal(result.acceptable, false);
  assert.match(result.problem ?? '', /usuario/);
  assert.equal(result.checks.find((c) => c.id === 'noUsername')?.passed, false);
});

test('leading or trailing spaces are rejected (login trims the password)', () => {
  assert.equal(evaluatePassword(' Zk9#Lm2$Qx7!pW').acceptable, false);
  assert.equal(evaluatePassword('Zk9#Lm2$Qx7!pW ').acceptable, false);
});

test('over the max length is rejected', () => {
  assert.equal(evaluatePassword('aB3$'.repeat(5) + 'x'.repeat(200)).acceptable, false);
});

test('a mixed 14-char password is accepted and strong', () => {
  const result = evaluatePassword('Zk9#Lm2$Qx7!pW');
  assert.equal(result.acceptable, true);
  assert.ok(result.score >= 3);
  assert.equal(result.problem, undefined);
});

test('a long lowercase passphrase is accepted', () => {
  const result = evaluatePassword('caballo azul nada sobre limones');
  assert.equal(result.acceptable, true);
  assert.equal(result.score, 4);
});

test('lowercase-only 12 chars is not enough on its own', () => {
  const result = evaluatePassword('mqzvhxkdlrpw');
  assert.equal(result.score, 2);
  assert.equal(result.acceptable, false);
});

test('score never decreases when appending characters to a clean password', () => {
  const base = evaluatePassword('Zk9#Lm2$Qx7!');
  const longer = evaluatePassword('Zk9#Lm2$Qx7!pWvB');
  assert.ok(longer.score >= base.score);
});
