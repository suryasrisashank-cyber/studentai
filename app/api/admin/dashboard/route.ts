import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db, getDatabaseStatus } from '@/lib/db';
import { aiRouter } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const settings = await db.getSiteSetting('analytics_config', { activeWindowMinutes: 5 });
    const activeWindow = settings?.activeWindowMinutes || 5;

    const [metrics, activity] = await Promise.all([
      db.getDashboardMetrics(activeWindow),
      db.getActivityLogs(1, 10),
    ]);

    const dbStatus = getDatabaseStatus();
    const providerStatus = aiRouter.getProviderStatus();

    return NextResponse.json(
      {
        metrics,
        recentActivity: activity.logs,
        systemStatus: {
          database: dbStatus,
          auth: { email: 'configured', session: 'active' },
          aiProviders: {
            google: providerStatus.google ? 'configured' : 'not configured',
            groq: providerStatus.groq ? 'configured' : 'not configured',
            openrouter: providerStatus.openrouter ? 'configured' : 'not configured',
          },
          telemetry: { activeWindowMinutes: activeWindow, status: 'operational' },
        },
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[Admin API] Dashboard error:', err);
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 });
  }
}
