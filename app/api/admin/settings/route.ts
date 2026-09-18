import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const [maintenance, analyticsConfig] = await Promise.all([
      db.getSiteSetting('maintenance_mode', {
        enabled: false,
        message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
      }),
      db.getSiteSetting('analytics_config', {
        activeWindowMinutes: 5,
        retentionDays: 30,
      }),
    ]);

    return NextResponse.json({ maintenance, analyticsConfig }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { maintenance, analyticsConfig } = body || {};

    if (maintenance !== undefined) {
      const sanitized = {
        enabled: Boolean(maintenance.enabled),
        message: typeof maintenance.message === 'string' ? maintenance.message.slice(0, 300) : 'StudentAI is undergoing scheduled maintenance.',
      };
      await db.setSiteSetting('maintenance_mode', sanitized);
    }

    if (analyticsConfig !== undefined) {
      const sanitized = {
        activeWindowMinutes: Math.min(60, Math.max(1, parseInt(analyticsConfig.activeWindowMinutes || 5, 10))),
        retentionDays: Math.min(365, Math.max(7, parseInt(analyticsConfig.retentionDays || 30, 10))),
      };
      await db.setSiteSetting('analytics_config', sanitized);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
