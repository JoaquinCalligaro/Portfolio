import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFailure,
  lockRemainingMs,
  IP_FAILURES,
} from '../src/lib/admin-auth/rate-limit-policy.ts';
import {
  evaluateSession,
  generateToken,
  hashToken,
  isRecentAuth,
  SESSION_ABSOLUTE_MAX_MS,
  SESSION_TTL_MS,
} from '../src/lib/admin-auth/session-policy.ts';

const MIN = 60_000;

test('locks on the 5th failure and doubles on repeat', () => {
  let state = null;
  for (let i = 0; i < 4; i++) {
    state = applyFailure(state, 0, IP_FAILURES);
    assert.equal(state.lockedUntil, null);
  }
  state = applyFailure(state, 0, IP_FAILURES);
  assert.equal(lockRemainingMs(state, 0), 15 * MIN);
  assert.equal(state.failCount, 0);

  const t = 16 * MIN;
  for (let i = 0; i < 5; i++) state = applyFailure(state, t, IP_FAILURES);
  assert.equal(lockRemainingMs(state, t), 30 * MIN);
});

test('lock is capped at 24 hours', () => {
  let state = { failCount: 4, windowStart: 0, lockedUntil: null, lockLevel: 20 };
  state = applyFailure(state, 0, IP_FAILURES);
  assert.equal(lockRemainingMs(state, 0), 24 * 60 * MIN);
});

test('failures outside the window do not accumulate', () => {
  let state = null;
  for (let i = 0; i < 4; i++) state = applyFailure(state, 0, IP_FAILURES);
  state = applyFailure(state, 20 * MIN, IP_FAILURES);
  assert.equal(state.failCount, 1);
  assert.equal(state.lockedUntil, null);
});

test('tokens are random and hashed deterministically', () => {
  const a = generateToken();
  assert.notEqual(a, generateToken());
  assert.equal(hashToken(a), hashToken(a));
  assert.notEqual(hashToken(a), a);
  assert.equal(hashToken(a).length, 64);
});

test('session expires, renews on use and has an absolute cap', () => {
  const base = { createdAt: 0, expiresAt: SESSION_TTL_MS, lastSeenAt: 0 };
  assert.deepEqual(evaluateSession(base, 1 * MIN), { valid: true, renewTo: null });
  const renewed = evaluateSession(base, 10 * MIN);
  assert.deepEqual(renewed, { valid: true, renewTo: 10 * MIN + SESSION_TTL_MS });
  assert.deepEqual(evaluateSession(base, SESSION_TTL_MS), { valid: false });
  const old = { createdAt: 0, expiresAt: Infinity, lastSeenAt: 0 };
  assert.deepEqual(evaluateSession(old, SESSION_ABSOLUTE_MAX_MS), { valid: false });
});

test('recent auth lasts 10 minutes', () => {
  assert.equal(isRecentAuth(0, 9 * MIN), true);
  assert.equal(isRecentAuth(0, 10 * MIN), false);
});
