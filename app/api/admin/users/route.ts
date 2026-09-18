import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { prisma, getDatabaseStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '20', 10)));
  const skip = (page - 1) * pageSize;

  const dbStatus = getDatabaseStatus();

  try {
    if (prisma && dbStatus.connected && !dbStatus.isDevelopmentFallback) {
      const [total, sessions] = await Promise.all([
        prisma.userSession.count(),
        prisma.userSession.findMany({
          orderBy: { lastActiveAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);

      const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);

      const items = sessions.map((s) => ({
        id: s.id,
        anonymousId: s.anonymousId.slice(0, 8) + '...' + s.anonymousId.slice(-4),
        deviceCategory: s.deviceCategory || 'Desktop',
        firstSeen: s.firstSeen.toISOString(),
        lastActiveAt: s.lastActiveAt.toISOString(),
        isActiveNow: s.lastActiveAt >= activeThreshold,
      }));

      return NextResponse.json({ items, total, page, pageSize, available: true }, { status: 200 });
    }

    // Offline / unconfigured or dev fallback
    return NextResponse.json({
      items: [],
      total: 0,
      page,
      pageSize,
      available: dbStatus.connected,
      message: dbStatus.message,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve users list' }, { status: 500 });
  }
}
