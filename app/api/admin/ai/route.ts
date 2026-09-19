import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { aiRouter } from '@/lib/ai/router';
import { SUPPORTED_MODELS, validateModelId } from '@/lib/ai/models/catalog';
import { AISiteSettings } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const [telemetry, aiSettings] = await Promise.all([
      db.getAITelemetry(),
      aiRouter.getEffectiveSettings(),
    ]);

    const configStatus = aiRouter.getProviderStatus();
    const chain = await aiRouter.getFallbackChain();

    return NextResponse.json(
      {
        telemetry,
        aiSettings,
        providers: {
          google: {
            isConfigured: configStatus.google,
            isAvailable: validateModelId('google', aiSettings.googleModel).valid,
            model: aiSettings.googleModel,
            catalog: SUPPORTED_MODELS.google,
          },
          groq: {
            isConfigured: configStatus.groq,
            isAvailable: validateModelId('groq', aiSettings.groqModel).valid,
            model: aiSettings.groqModel,
            catalog: SUPPORTED_MODELS.groq,
          },
          openrouter: {
            isConfigured: configStatus.openrouter,
            isAvailable: validateModelId('openrouter', aiSettings.openrouterModel).valid,
            model: aiSettings.openrouterModel,
            catalog: SUPPORTED_MODELS.openrouter,
          },
        },
        fallbackChain: chain,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve AI configuration.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const current = await aiRouter.getEffectiveSettings();

    const updated: AISiteSettings = {
      ...current,
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      ...(body.primaryProvider && ['google', 'groq', 'openrouter'].includes(body.primaryProvider)
        ? { primaryProvider: body.primaryProvider }
        : {}),
      ...(body.secondaryProvider && ['google', 'groq', 'openrouter'].includes(body.secondaryProvider)
        ? { secondaryProvider: body.secondaryProvider }
        : {}),
      ...(body.tertiaryProvider && ['google', 'groq', 'openrouter'].includes(body.tertiaryProvider)
        ? { tertiaryProvider: body.tertiaryProvider }
        : {}),
      ...(body.googleModel && typeof body.googleModel === 'string'
        ? { googleModel: body.googleModel.trim() }
        : {}),
      ...(body.groqModel && typeof body.groqModel === 'string'
        ? { groqModel: body.groqModel.trim() }
        : {}),
      ...(body.openrouterModel && typeof body.openrouterModel === 'string'
        ? { openrouterModel: body.openrouterModel.trim() }
        : {}),
      ...(typeof body.retrievalEnabled === 'boolean'
        ? { retrievalEnabled: body.retrievalEnabled }
        : {}),
      ...(typeof body.maxOutputTokens === 'number' && body.maxOutputTokens >= 100 && body.maxOutputTokens <= 8000
        ? { maxOutputTokens: body.maxOutputTokens }
        : {}),
    };

    // Validate configured model IDs
    const gCheck = validateModelId('google', updated.googleModel);
    const qCheck = validateModelId('groq', updated.groqModel);
    const oCheck = validateModelId('openrouter', updated.openrouterModel);

    if (!gCheck.valid || !qCheck.valid || !oCheck.valid) {
      return NextResponse.json(
        { error: 'One or more model IDs contain invalid characters.' },
        { status: 400 }
      );
    }

    await db.setSiteSetting('ai_settings', updated);
    const auditAction = typeof body.enabled === 'boolean' && body.enabled !== current.enabled ? 'AI_ASSISTANT_TOGGLED' : 'AI_SETTINGS_UPDATED';
    await db.auditAdminAction(auditAction, {
      enabled: updated.enabled,
      primaryProvider: updated.primaryProvider,
      retrievalEnabled: updated.retrievalEnabled,
    });


    return NextResponse.json({ success: true, aiSettings: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update AI settings.' }, { status: 500 });
  }
}
