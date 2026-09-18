import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid Content-Type.' }, { status: 415 });
    }

    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

    const result = await authenticateAdmin(email, password, clientIp);

    if (!result.success || !result.token) {
      const status = result.error?.includes('Too many') ? 429 : 401;
      return NextResponse.json(
        { error: result.error || 'Invalid credentials.' },
        { status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'Authentication successful.' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );

    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (err) {
    console.error('[Admin Auth] Login error:', err);
    return NextResponse.json({ error: 'Authentication service temporarily unavailable.' }, { status: 500 });
  }
}
