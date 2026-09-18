import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  try {
    const data = await db.getToolAnalytics(range);
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
