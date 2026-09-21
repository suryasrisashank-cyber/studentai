import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { aiRouter } from '@/lib/ai/router';
import { SUPPORTED_MODELS, validateModelId } from '@/lib/ai/models/catalog';
import { AIProviderName, AISiteSettings } from '@/lib/ai/types';

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

    const chain = await aiRouter.getFallbackChain();

    const providerNames: AIProviderName[] = ['google', 'groq', 'openrouter', 'bytez', 'atria', 'claude'];
    const providersState: Record<string, any> = {};

    for (const name of providerNames) {
      const model = aiRouter.getModelForProvider(name, aiSettings);
      const state = aiRouter.getProviderState(name, model);
      providersState[name] = {
        name,
        isConfigured: state.configured,
        isAvailable: state.available,
        isOperational: state.operational,
        status: state.status,
        model,
        timeoutMs: aiRouter.getTimeoutForProvider(name, aiSettings),
        maxTokens: aiRouter.getTokenLimitForProvider(name, aiSettings),
        catalog: SUPPORTED_MODELS[name] || [],
      };
    }

    return NextResponse.json(
      {
        telemetry,
        aiSettings,
        providers: providersState,
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

    const validProviders: AIProviderName[] = ['google', 'groq', 'openrouter', 'bytez', 'atria', 'claude'];

    const updated: AISiteSettings = {
      ...current,
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      ...(typeof body.globalKillSwitch === 'boolean' ? { globalKillSwitch: body.globalKillSwitch } : {}),
      ...(body.primaryProvider && validProviders.includes(body.primaryProvider)
        ? { primaryProvider: body.primaryProvider }
        : {}),
      ...(body.secondaryProvider && validProviders.includes(body.secondaryProvider)
        ? { secondaryProvider: body.secondaryProvider }
        : {}),
      ...(body.tertiaryProvider && validProviders.includes(body.tertiaryProvider)
        ? { tertiaryProvider: body.tertiaryProvider }
        : {}),
      ...(Array.isArray(body.providerPriority)
        ? { providerPriority: body.providerPriority.filter((p: string) => validProviders.includes(p as AIProviderName)) }
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
      ...(body.bytezModel && typeof body.bytezModel === 'string'
        ? { bytezModel: body.bytezModel.trim() }
        : {}),
      ...(body.atriaModel && typeof body.atriaModel === 'string'
        ? { atriaModel: body.atriaModel.trim() }
        : {}),
      ...(typeof body.retrievalEnabled === 'boolean'
        ? { retrievalEnabled: body.retrievalEnabled }
        : {}),
      ...(typeof body.maxOutputTokens === 'number' && body.maxOutputTokens >= 100 && body.maxOutputTokens <= 8000
        ? { maxOutputTokens: body.maxOutputTokens }
        : {}),
      ...(body.providerTimeouts && typeof body.providerTimeouts === 'object'
        ? { providerTimeouts: { ...current.providerTimeouts, ...body.providerTimeouts } }
        : {}),
      ...(body.providerTokenLimits && typeof body.providerTokenLimits === 'object'
        ? { providerTokenLimits: { ...current.providerTokenLimits, ...body.providerTokenLimits } }
        : {}),
      ...(typeof body.rateLimitPerMinute === 'number' && body.rateLimitPerMinute > 0
        ? { rateLimitPerMinute: body.rateLimitPerMinute }
        : {}),
      ...(typeof body.dailyQuotaPerIp === 'number' && body.dailyQuotaPerIp > 0
        ? { dailyQuotaPerIp: body.dailyQuotaPerIp }
        : {}),
    };

    // If globalKillSwitch is true, set enabled to false as well
    if (updated.globalKillSwitch) {
      updated.enabled = false;
    }

    // Validate configured model IDs
    const gCheck = validateModelId('google', updated.googleModel);
    const qCheck = validateModelId('groq', updated.groqModel);
    const oCheck = validateModelId('openrouter', updated.openrouterModel);
    const bCheck = updated.bytezModel ? validateModelId('bytez', updated.bytezModel) : { valid: true };
    const aCheck = updated.atriaModel ? validateModelId('atria', updated.atriaModel) : { valid: true };

    if (!gCheck.valid || !qCheck.valid || !oCheck.valid || !bCheck.valid || !aCheck.valid) {
      return NextResponse.json(
        { error: 'One or more model IDs contain invalid characters or unsupported format.' },
        { status: 400 }
      );
    }

    await db.setSiteSetting('ai_settings', updated);
    const auditAction =
      typeof body.globalKillSwitch === 'boolean' && body.globalKillSwitch !== current.globalKillSwitch
        ? 'AI_KILL_SWITCH_TOGGLED'
        : typeof body.enabled === 'boolean' && body.enabled !== current.enabled
        ? 'AI_ASSISTANT_TOGGLED'
        : 'AI_SETTINGS_UPDATED';

    await db.auditAdminAction(auditAction, {
      enabled: updated.enabled,
      globalKillSwitch: updated.globalKillSwitch,
      primaryProvider: updated.primaryProvider,
      retrievalEnabled: updated.retrievalEnabled,
    });

    return NextResponse.json({ success: true, aiSettings: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update AI settings.' }, { status: 500 });
  }
}
