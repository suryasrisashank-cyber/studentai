import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const [maintenance, analyticsConfig, aiSettings] = await Promise.all([
      db.getSiteSetting('maintenance_mode', {
        enabled: false,
        message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
      }),
      db.getSiteSetting('analytics_config', {
        activeWindowMinutes: 5,
        retentionDays: 30,
      }),
      db.getSiteSetting('ai_settings', {
        enabled: true,
      }),
    ]);

    return NextResponse.json(
      { maintenance, analyticsConfig, aiSettings },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
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
    const { maintenance, analyticsConfig, aiSettings } = body || {};

    if (maintenance !== undefined) {
      const sanitized = {
        enabled: Boolean(maintenance.enabled),
        message:
          typeof maintenance.message === 'string'
            ? maintenance.message.slice(0, 300)
            : 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
      };
      await db.setSiteSetting('maintenance_mode', sanitized);
      await db.auditAdminAction('MAINTENANCE_TOGGLED', {
        enabled: sanitized.enabled,
        message: sanitized.message,
      });
    }

    if (aiSettings !== undefined) {
      const sanitizedAi = {
        enabled: Boolean(aiSettings.enabled),
      };
      await db.setSiteSetting('ai_settings', sanitizedAi);
      await db.auditAdminAction('AI_ASSISTANT_TOGGLED', {
        enabled: sanitizedAi.enabled,
      });
    }

    if (analyticsConfig !== undefined) {
      const sanitized = {
        activeWindowMinutes: Math.min(60, Math.max(1, parseInt(analyticsConfig.activeWindowMinutes || 5, 10))),
        retentionDays: Math.min(365, Math.max(7, parseInt(analyticsConfig.retentionDays || 30, 10))),
      };
      await db.setSiteSetting('analytics_config', sanitized);
      await db.auditAdminAction('ANALYTICS_CONFIG_UPDATED', sanitized);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
