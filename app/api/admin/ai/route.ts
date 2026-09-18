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
    const telemetry = await db.getAITelemetry();
    const configStatus = aiRouter.getProviderStatus();
    const chain = aiRouter.getFallbackChain();

    return NextResponse.json(
      {
        telemetry,
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
