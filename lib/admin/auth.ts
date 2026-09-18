import crypto from 'crypto';
import { db } from '../db';

export const ADMIN_EMAIL = 'logindetails-admin@gmail.com';
export const ADMIN_COOKIE_NAME = 'studentai_admin_session';

// Rate limiter for admin login attempts: max 5 failures per 15 min per IP
interface LoginAttemptTracker {
  failures: number;
  blockedUntil?: number;
}
const loginAttempts = new Map<string, LoginAttemptTracker>();

// Fallback secret for dev if AUTH_SECRET is not configured
const FALLBACK_AUTH_SECRET = 'studentai_auth_dev_fallback_key';
const getAuthSecret = () => process.env.AUTH_SECRET?.trim() || FALLBACK_AUTH_SECRET;

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verifies password against ADMIN_PASSWORD or ADMIN_PASSWORD_HASH.
 * Strictly prevents hardcoding.
 */
function verifyPassword(suppliedPassword: string): boolean {
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  // 1. Direct password match (constant-time)
  if (envPassword && safeEqual(suppliedPassword, envPassword)) {
    return true;
  }

  // 2. Hash match if ADMIN_PASSWORD_HASH is set (SHA-256)
  if (envHash) {
    const suppliedHash = crypto.createHash('sha256').update(suppliedPassword).digest('hex');
    if (safeEqual(suppliedHash, envHash)) {
      return true;
    }
  }

  return false;
}

/**
 * Creates a cryptographically signed session token.
 * Payload format: adminId:timestamp:nonce:signature
 */
export function createSignedSessionToken(email: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const data = `${email}:${timestamp}:${nonce}`;
  const signature = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('hex');
  return Buffer.from(`${data}:${signature}`).toString('base64url');
}

/**
 * Verifies a signed session token.
 * Token expires after 8 hours.
 */
export function verifySessionToken(token: string): boolean {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;

    const [email, timestampStr, nonce, signature] = parts;
    if (email !== ADMIN_EMAIL) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check expiration (8 hours)
    const MAX_AGE_MS = 8 * 60 * 60 * 1000;
    if (Date.now() - timestamp > MAX_AGE_MS || Date.now() < timestamp) {
      return false;
    }

    // Verify HMAC signature
    const data = `${email}:${timestamp}:${nonce}`;
    const expectedSignature = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('hex');

    return safeEqual(signature, expectedSignature);
  } catch {
    return false;
  }
}

/**
 * Authenticates admin credentials with rate-limiting.
 */
export async function authenticateAdmin(
  emailInput: string,
  passwordInput: string,
  clientIp: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const now = Date.now();
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // 1. Check rate limit
  let tracker = loginAttempts.get(clientIp);
  if (!tracker) {
    tracker = { failures: 0 };
    loginAttempts.set(clientIp, tracker);
  }

  if (tracker.blockedUntil && tracker.blockedUntil > now) {
    const remainingMin = Math.ceil((tracker.blockedUntil - now) / (60 * 1000));
    return {
      success: false,
      error: `Too many failed attempts. Please wait ${remainingMin} minute(s) before trying again.`,
    };
  }

  // 2. Validate email and password (Constant-time check to prevent username enumeration)
  const isEmailValid = safeEqual(email, ADMIN_EMAIL.toLowerCase());
  const isPasswordValid = verifyPassword(password);

  if (!isEmailValid || !isPasswordValid) {
    tracker.failures += 1;
    if (tracker.failures >= 5) {
      tracker.blockedUntil = now + 15 * 60 * 1000; // 15-minute lock
    }

    await db.recordLoginEvent({ email, status: 'FAILURE' });

    // Generic error: never reveal if email exists or password was close
    return {
      success: false,
      error: 'Invalid credentials.',
    };
  }

  // 3. Success: Reset failure count and record audit event
  tracker.failures = 0;
  tracker.blockedUntil = undefined;

  await db.recordLoginEvent({ email, status: 'SUCCESS' });
  const token = createSignedSessionToken(email);

  return {
    success: true,
    token,
  };
}

/**
 * Server-side authorization check for API routes and server components.
 */
export function checkAdminAuth(req: Request): boolean {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
    const token = match ? decodeURIComponent(match[1]) : '';
    return verifySessionToken(token);
  } catch {
    return false;
  }
}

