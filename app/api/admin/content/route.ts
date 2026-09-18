import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sanitizeText(str: string, maxLen = 500): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const [announcement, aiWelcome, maintenance] = await Promise.all([
      db.getSiteSetting('announcement', { enabled: false, text: '', type: 'info' }),
      db.getSiteSetting('ai_welcome', {
        greeting: 'Ask. Learn. Understand.',
        subtitle: 'Your free educational assistant for conceptual clarity and exam prep.',
      }),
      db.getSiteSetting('maintenance_mode', {
        enabled: false,
        message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
      }),
    ]);

    return NextResponse.json({ announcement, aiWelcome, maintenance }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to load content settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { section, data } = body || {};

    if (section === 'announcement') {
      const sanitized = {
        enabled: Boolean(data?.enabled),
        text: sanitizeText(data?.text || '', 280),
        type: ['info', 'success', 'warning'].includes(data?.type) ? data.type : 'info',
      };
      await db.setSiteSetting('announcement', sanitized);
      return NextResponse.json({ success: true, announcement: sanitized });
    }

    if (section === 'ai_welcome') {
      const sanitized = {
        greeting: sanitizeText(data?.greeting || 'Ask. Learn. Understand.', 100),
        subtitle: sanitizeText(data?.subtitle || '', 200),
      };
      await db.setSiteSetting('ai_welcome', sanitized);
      return NextResponse.json({ success: true, aiWelcome: sanitized });
    }

    if (section === 'maintenance') {
      const sanitized = {
        enabled: Boolean(data?.enabled),
        message: sanitizeText(data?.message || '', 300),
      };
      await db.setSiteSetting('maintenance_mode', sanitized);
      return NextResponse.json({ success: true, maintenance: sanitized });
    }

    return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update content settings' }, { status: 500 });
  }
}
