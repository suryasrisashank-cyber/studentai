import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { aiRouter } from '@/lib/ai/router';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const [telemetry, aiSettings] = await Promise.all([
      db.getAITelemetry(),
      db.getSiteSetting('ai_settings', { enabled: true }),
    ]);
    const configStatus = aiRouter.getProviderStatus();
    const chain = aiRouter.getFallbackChain();

    return NextResponse.json(
      {
        telemetry,
        aiSettings,
        providers: {
          google: {
            isConfigured: configStatus.google,
            model: process.env.AI_GOOGLE_MODEL || 'gemini-2.5-flash',
          },
          groq: {
            isConfigured: configStatus.groq,
            model: process.env.AI_GROQ_MODEL || 'openai/gpt-oss-120b',
          },
          openrouter: {
            isConfigured: configStatus.openrouter,
            model: process.env.AI_OPENROUTER_MODEL || 'openrouter/free',
          },
        },
        fallbackChain: chain,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve AI telemetry' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { enabled } = body || {};

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled boolean is required' }, { status: 400 });
    }

    await db.setSiteSetting('ai_settings', { enabled });
    await db.auditAdminAction('AI_ASSISTANT_TOGGLED', { enabled });

    return NextResponse.json({ success: true, enabled }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}

