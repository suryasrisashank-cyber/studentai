import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { prisma, getDatabaseStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  const dbStatus = getDatabaseStatus();
  if (!dbStatus.connected && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { available: false, message: 'Analytics database unconfigured' },
      { status: 200 }
    );
  }

  const now = new Date();
  let since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === 'today') {
    since = new Date();
    since.setHours(0, 0, 0, 0);
  } else if (range === '30d') {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '90d') {
    since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (range === 'all') {
    since = new Date(0);
  }

  try {
    if (prisma && dbStatus.connected && !dbStatus.isDevelopmentFallback) {
      const [toolEvents, aiEvents, loginEvents] = await Promise.all([
        prisma.usageEvent.findMany({
          where: { eventType: 'TOOL_USED', createdAt: { gte: since } },
          select: { feature: true, createdAt: true },
        }),
        prisma.usageEvent.findMany({
          where: { eventType: { in: ['AI_REQUEST', 'AI_SUCCESS'] }, createdAt: { gte: since } },
          select: { eventType: true, feature: true, createdAt: true },
        }),
        prisma.loginEvent.findMany({
          where: { createdAt: { gte: since } },
          select: { status: true, createdAt: true },
        }),
      ]);

      // Aggregate tool usage by slug
      const toolUsageMap: Record<string, number> = {};
      for (const t of toolEvents) {
        toolUsageMap[t.feature] = (toolUsageMap[t.feature] || 0) + 1;
      }

      return NextResponse.json({
        available: true,
        totalToolUses: toolEvents.length,
        totalAIRequests: aiEvents.length,
        totalLogins: loginEvents.filter((l) => l.status === 'SUCCESS').length,
        toolBreakdown: toolUsageMap,
        range,
      });
    }

    // Dev/offline fallback with real local metrics
    return NextResponse.json({
      available: true,
      totalToolUses: 0,
      totalAIRequests: 0,
      totalLogins: 0,
      toolBreakdown: {},
      range,
      message: 'No analytics records found for this period.',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
