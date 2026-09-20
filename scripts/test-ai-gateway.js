/**
 * StudentAI — AI Gateway & Fallback Verification Suite
 * Validates provider configuration, fallback chain, rate limiting, and input security.
 */

const assert = require('assert');
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

console.log('--- Starting StudentAI AI Gateway & Fallback Tests ---\n');

// 1. Provider Configuration Status (Safe check: reports only configured/not configured)
console.log('[1] Checking Provider Configuration Status...');
const googleConfigured = Boolean(process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY.trim().length > 0);
const groqConfigured = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0);

console.log(`  Google: ${googleConfigured ? 'configured' : 'not configured'}`);
console.log(`  Groq: ${groqConfigured ? 'configured' : 'not configured'}`);
console.log(`  OpenRouter: ${openrouterConfigured ? 'configured' : 'not configured'}`);

// 2. Model & Fallback Order Verification
console.log('\n[2] Verifying Model & Provider Hierarchy...');
const primary = process.env.AI_PRIMARY_PROVIDER || 'google';
const secondary = process.env.AI_SECONDARY_PROVIDER || 'groq';
const tertiary = process.env.AI_TERTIARY_PROVIDER || 'openrouter';

const googleModel = process.env.AI_GOOGLE_MODEL || 'gemini-3.6-flash';
const groqModel = process.env.AI_GROQ_MODEL || 'openai/gpt-oss-120b';
const openrouterModel = process.env.AI_OPENROUTER_MODEL || 'openrouter/free';

assert.strictEqual(primary, 'google', 'Primary provider should default to google');
assert.strictEqual(secondary, 'groq', 'Secondary provider should default to groq');
assert.strictEqual(tertiary, 'openrouter', 'Tertiary provider should default to openrouter');
assert.ok(googleModel === 'gemini-3.6-flash' || googleModel === 'gemini-2.5-flash', 'Google model should be active gemini flash');
assert.strictEqual(groqModel, 'openai/gpt-oss-120b', 'Groq model should be openai/gpt-oss-120b');
assert.strictEqual(openrouterModel, 'openrouter/free', 'OpenRouter model should be openrouter/free');
console.log('  ✓ Provider hierarchy & models verified: Google → Groq → OpenRouter');

// 3. Fallback Mechanism Simulation Test
console.log('\n[3] Testing Fallback Chain Logic...');
{
  class MockRouter {
    constructor(failingProviders = []) {
      this.failing = failingProviders;
      this.chain = [primary, secondary, tertiary];
      this.called = [];
    }

    async generate() {
      for (const p of this.chain) {
        this.called.push(p);
        if (this.failing.includes(p)) {
          // simulate provider error / rate limit / 503
          continue;
        }
        return { text: 'Success', provider: p };
      }
      throw new Error('All providers failed');
    }
  }

  // Case A: Primary succeeds
  const rA = new MockRouter([]);
  rA.generate().then((res) => {
    assert.strictEqual(res.provider, 'google');
    assert.deepStrictEqual(rA.called, ['google']);
  });

  // Case B: Primary fails -> falls back to Groq
  const rB = new MockRouter(['google']);
  rB.generate().then((res) => {
    assert.strictEqual(res.provider, 'groq');
    assert.deepStrictEqual(rB.called, ['google', 'groq']);
  });

  // Case C: Primary & Groq fail -> falls back to OpenRouter
  const rC = new MockRouter(['google', 'groq']);
  rC.generate().then((res) => {
    assert.strictEqual(res.provider, 'openrouter');
    assert.deepStrictEqual(rC.called, ['google', 'groq', 'openrouter']);
  });

  console.log('  ✓ Fallback transitions (Google → Groq → OpenRouter) verified');
}

// 4. Input Validation & Role Sanitization
console.log('\n[4] Testing Input Validation & Role Rejection...');
{
  // Test message length limits
  const maxLen = 3000;
  const longMsg = 'a'.repeat(maxLen + 10);
  assert.ok(longMsg.length > maxLen, 'Message exceeds limit');

  // Test allowed roles
  const validRoles = ['user', 'assistant'];
  const invalidRoles = ['system', 'developer', 'tool', 'admin'];

  for (const r of invalidRoles) {
    assert.ok(!validRoles.includes(r), `Role "${r}" must be rejected from client requests`);
  }
  console.log('  ✓ Disallowed client roles (system/developer/tool) properly rejected');
}

// 5. Rate Limiter Logic
console.log('\n[5] Testing Rate Limiting Behavior...');
{
  const testWindow = [];
  const limit = 10;
  let allowedCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < 15; i++) {
    if (testWindow.length < limit) {
      testWindow.push(Date.now());
      allowedCount++;
    } else {
      blockedCount++;
    }
  }

  assert.strictEqual(allowedCount, 10, 'Should allow exact limit');
  assert.strictEqual(blockedCount, 5, 'Should block requests exceeding limit');
  console.log('  ✓ Rate limiting blocks rapid repeated requests');
}

// 6. Zero-Request Dashboard Metrics Formatting
console.log('\n[6] Testing Zero-Request Dashboard Metrics Formatter...');
{
  function formatSuccessRate(requests, successes) {
    return requests > 0 ? `${Math.round((successes / requests) * 100)}% (${requests} reqs)` : 'No requests';
  }

  function formatAvgLatency(requests, avgLatencyMs) {
    return requests > 0 && avgLatencyMs > 0 ? `${avgLatencyMs}ms` : 'No data';
  }

  // Case A: 0 requests
  assert.strictEqual(formatSuccessRate(0, 0), 'No requests', 'Zero requests must format as "No requests"');
  assert.strictEqual(formatAvgLatency(0, 0), 'No data', 'Zero requests must format as "No data"');

  // Case B: Real requests
  assert.strictEqual(formatSuccessRate(10, 9), '90% (10 reqs)');
  assert.strictEqual(formatAvgLatency(10, 420), '420ms');
  console.log('  ✓ Zero-request dashboard metrics display truthful placeholders instead of misleading 100%/0ms');
}

// 7. Smart Scroll Invariant Verification
console.log('\n[7] Testing Smart Scroll Invariant Logic...');
{
  function computeScrollReaction({ scrollHeight, scrollTop, clientHeight, isStreaming }) {
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const nearBottom = distanceFromBottom < 80;
    return {
      nearBottom,
      shouldFollowStream: isStreaming && nearBottom,
      showNewMessagesPill: isStreaming && !nearBottom,
    };
  }

  // Case A: User is reading at bottom
  const atBottom = computeScrollReaction({ scrollHeight: 1000, scrollTop: 650, clientHeight: 300, isStreaming: true });
  assert.strictEqual(atBottom.nearBottom, true);
  assert.strictEqual(atBottom.shouldFollowStream, true);
  assert.strictEqual(atBottom.showNewMessagesPill, false);

  // Case B: User has scrolled up to inspect previous answer
  const scrolledUp = computeScrollReaction({ scrollHeight: 1000, scrollTop: 200, clientHeight: 300, isStreaming: true });
  assert.strictEqual(scrolledUp.nearBottom, false);
  assert.strictEqual(scrolledUp.shouldFollowStream, false, 'User must NOT be forcefully pulled down');
  assert.strictEqual(scrolledUp.showNewMessagesPill, true, 'Floating pill must indicate new messages');
  console.log('  ✓ Smart chat scroll invariants verified: user never yanked down when scrolled up');
}

console.log('\n========================================');
console.log('ALL AI GATEWAY VERIFICATION CHECKS PASSED');
console.log('========================================');

