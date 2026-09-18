import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'studentai_admin_session';
const ADMIN_EMAIL = 'logindetails-admin@gmail.com';

/**
 * Edge-compatible HMAC-SHA256 signature verification using Web Crypto API.
 */
async function verifySessionTokenEdge(token: string, secret: string): Promise<boolean> {
  if (!token) return false;

  try {
    const raw = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const parts = raw.split(':');
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

    const data = `${email}:${timestamp}:${nonce}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSig;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Check if route is an admin page or admin API
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const secret = process.env.AUTH_SECRET?.trim() || 'studentai_auth_dev_fallback_key';

    const isValid = sessionCookie ? await verifySessionTokenEdge(sessionCookie, secret) : false;

    if (!isValid) {
      if (isAdminApi) {
        return NextResponse.json(
          { error: 'Unauthorized access.' },
          { status: 401, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const loginUrl = new URL('/admin/login', req.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('returnUrl', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and navigating to /admin/login, redirect to /admin
  if (pathname === '/admin/login') {
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const secret = process.env.AUTH_SECRET?.trim() || 'studentai_auth_dev_fallback_key';
    if (sessionCookie && (await verifySessionTokenEdge(sessionCookie, secret))) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
