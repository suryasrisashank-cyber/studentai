import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '20', 10)));

  try {
    const result = await db.getUsersList(page, pageSize);
    return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve users list' }, { status: 500 });
  }
}
