import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { eventType, toolSlug, sessionId, deviceCategory } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session identifier required' }, { status: 400 });
    }

    // Touch session for active-window tracking
    const cleanSessionId = sessionId.slice(0, 64);
    const cleanDevice = typeof deviceCategory === 'string' ? deviceCategory.slice(0, 32) : 'unknown';
    await db.touchSession(cleanSessionId, cleanDevice);

    // Record tool usage if applicable (strictly tool slug only, never user input text)
    if (eventType === 'TOOL_USED' && typeof toolSlug === 'string') {
      const cleanSlug = toolSlug.slice(0, 64);
      await db.recordUsageEvent({
        eventType: 'TOOL_USED',
        feature: cleanSlug,
        sessionId: cleanSessionId,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    // Fail silently to never block client tool usage
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
