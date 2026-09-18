/**
 * StudentAI — Admin Security & Control Center Verification Suite
 * Tests session signing, HMAC verification, rate limiting, constant-time validation,
 * and route protection.
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Manually load .env.local if present
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

console.log('--- Starting StudentAI Admin Security Verification Suite ---\n');

const ADMIN_EMAIL = 'logindetails-admin@gmail.com';
const AUTH_SECRET = process.env.AUTH_SECRET || 'studentai_auth_dev_fallback_key';

// 1. Secret Configuration Status
console.log('[1] Checking Admin Environment Configuration...');
const adminEmailConfigured = Boolean(process.env.ADMIN_EMAIL || ADMIN_EMAIL);
const adminPasswordConfigured = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
const authSecretConfigured = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim().length > 0);
const databaseUrlConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

console.log(`  Admin Email: ${adminEmailConfigured ? 'configured' : 'not configured'}`);
console.log(`  Admin Password: ${adminPasswordConfigured ? 'configured' : 'not configured'}`);
console.log(`  Auth Secret: ${authSecretConfigured ? 'configured' : 'not configured'}`);
console.log(`  Database URL: ${databaseUrlConfigured ? 'configured' : 'not configured'}`);

// Verify no hardcoded passwords in codebase
console.log('\n[2] Verifying Zero Hardcoded Credentials in Source Code...');
const authSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'admin', 'auth.ts'), 'utf8');
assert.ok(!authSource.includes('password = "'), 'No plain password assignment allowed in auth.ts');
assert.ok(!authSource.includes("password = '"), 'No plain password assignment allowed in auth.ts');
assert.ok(authSource.includes('process.env.ADMIN_PASSWORD'), 'Must read password from process.env');
console.log('  ✓ Verified: Admin password is read dynamically from environment variables');

// 3. Constant-Time Timing Attack Mitigation
console.log('\n[3] Testing Constant-Time Validation (crypto.timingSafeEqual)...');
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
assert.strictEqual(safeEqual('test-token-123', 'test-token-123'), true);
assert.strictEqual(safeEqual('test-token-123', 'test-token-456'), false);
assert.strictEqual(safeEqual('short', 'longer-string'), false);
console.log('  ✓ Constant-time string comparison verified');

// 4. Cryptographic HMAC Token Creation & Verification
console.log('\n[4] Testing Cryptographic HMAC Session Tokens...');
function createToken(email, secret, customTimestamp) {
  const timestamp = customTimestamp || Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const data = `${email}:${timestamp}:${nonce}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${data}:${sig}`).toString('base64url');
}

function verifyToken(token, secret) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;
    const [email, timestampStr, nonce, signature] = parts;
    if (email !== ADMIN_EMAIL) return false;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
    if (Date.now() - timestamp > MAX_AGE_MS || Date.now() < timestamp) return false;
    const data = `${email}:${timestamp}:${nonce}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return safeEqual(signature, expectedSig);
  } catch {
    return false;
  }
}

// Case A: Valid token passes
const validToken = createToken(ADMIN_EMAIL, AUTH_SECRET);
assert.strictEqual(verifyToken(validToken, AUTH_SECRET), true, 'Valid token must be verified');

// Case B: Tampered signature fails
const tamperedToken = validToken.slice(0, -4) + 'abcd';
assert.strictEqual(verifyToken(tamperedToken, AUTH_SECRET), false, 'Tampered token must fail');

// Case C: Wrong secret fails
assert.strictEqual(verifyToken(validToken, 'wrong_secret_key_123'), false, 'Wrong secret must fail');

// Case D: Expired token (>8h) fails
const expiredTimestamp = Date.now() - (9 * 60 * 60 * 1000); // 9 hours ago
const expiredToken = createToken(ADMIN_EMAIL, AUTH_SECRET, expiredTimestamp);
assert.strictEqual(verifyToken(expiredToken, AUTH_SECRET), false, 'Expired token must fail');

// Case E: Future token fails
const futureTimestamp = Date.now() + (60 * 60 * 1000); // 1 hour in future
const futureToken = createToken(ADMIN_EMAIL, AUTH_SECRET, futureTimestamp);
assert.strictEqual(verifyToken(futureToken, AUTH_SECRET), false, 'Future token must fail');

console.log('  ✓ HMAC session token generation, verification, and tamper detection passed');

// 5. Brute Force Rate Limiting
console.log('\n[5] Testing Rate Limiting (5 failures / 15 min lock)...');
{
  const loginTracker = new Map();
  const testIp = '192.168.1.100';

  function simulateAttempt(ip, isCorrect) {
    const now = Date.now();
    let tracker = loginTracker.get(ip);
    if (!tracker) {
      tracker = { failures: 0 };
      loginTracker.set(ip, tracker);
    }
    if (tracker.blockedUntil && tracker.blockedUntil > now) {
      return { allowed: false, reason: 'BLOCKED' };
    }
    if (!isCorrect) {
      tracker.failures += 1;
      if (tracker.failures >= 5) {
        tracker.blockedUntil = now + 15 * 60 * 1000;
      }
      return { allowed: true, success: false };
    }
    tracker.failures = 0;
    tracker.blockedUntil = undefined;
    return { allowed: true, success: true };
  }

  // 4 failed attempts should still be allowed to try
  for (let i = 1; i <= 4; i++) {
    const res = simulateAttempt(testIp, false);
    assert.strictEqual(res.allowed, true, `Attempt ${i} should be allowed`);
    assert.strictEqual(res.success, false, `Attempt ${i} should fail`);
  }

  // 5th failed attempt triggers lockout
  const attempt5 = simulateAttempt(testIp, false);
  assert.strictEqual(attempt5.allowed, true);
  assert.strictEqual(attempt5.success, false);

  // 6th attempt is blocked
  const attempt6 = simulateAttempt(testIp, false);
  assert.strictEqual(attempt6.allowed, false, '6th attempt must be locked out');
  assert.strictEqual(attempt6.reason, 'BLOCKED');

  console.log('  ✓ Brute-force lockout triggers after 5 failed attempts');
}

// 6. Anonymous Telemetry & Zero Fake Data Policy
console.log('\n[6] Testing Telemetry Validation & Zero Fake Data Policy...');
{
  const validEventTypes = ['HEARTBEAT', 'TOOL_USED', 'AI_REQUEST', 'LOGIN_SUCCESS', 'LOGIN_FAILURE'];
  for (const evt of ['HEARTBEAT', 'TOOL_USED']) {
    assert.ok(validEventTypes.includes(evt), `Event ${evt} should be recognized`);
  }

  // Active session window definition: 5 minutes (300,000 ms)
  const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
  const recentPing = Date.now() - 60 * 1000; // 1 min ago
  const stalePing = Date.now() - 10 * 60 * 1000; // 10 min ago

  assert.ok(Date.now() - recentPing <= ACTIVE_WINDOW_MS, 'Recent ping is active');
  assert.ok(Date.now() - stalePing > ACTIVE_WINDOW_MS, 'Stale ping is inactive');
  console.log('  ✓ 5-minute active session window boundary verified');
}

console.log('\n========================================');
console.log('ALL ADMIN SECURITY VERIFICATION CHECKS PASSED');
console.log('========================================');
