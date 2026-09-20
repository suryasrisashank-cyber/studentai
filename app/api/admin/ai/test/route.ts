import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { aiRouter } from '@/lib/ai/router';
import { retrieveCurrentData } from '@/lib/ai/retrieval/search';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { AIProviderName, SourceCitation } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  const start = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const testPrompt = (body?.prompt || 'Hello! Test StudentAI connectivity and output latency.').trim();
    const testRetrieval = Boolean(body?.testRetrieval);
    const targetProvider: AIProviderName | undefined = body?.provider && ['google', 'groq', 'openrouter', 'bytez', 'atria'].includes(body.provider)
      ? body.provider
      : undefined;

    let sources: SourceCitation[] = [];
    let groundedContext = '';
    let retrievalUsed = false;

    if (testRetrieval) {
      try {
        const retrieval = await retrieveCurrentData(testPrompt);
        if (retrieval.retrievalUsed) {
          sources = retrieval.sources;
          groundedContext = retrieval.groundedPromptContext;
          retrievalUsed = true;
        }
      } catch {
        // Continue to AI generation
      }
    }

    const systemPrompt = buildSystemPrompt('general', groundedContext);
    const messages = [{ role: 'user' as const, content: testPrompt }];

    let response;
    if (targetProvider) {
      const provider = aiRouter.getProvider(targetProvider);
      if (!provider) {
        return NextResponse.json({ success: false, error: `Provider ${targetProvider} is not registered.` }, { status: 400 });
      }
      if (!provider.isConfigured()) {
        return NextResponse.json({
          success: false,
          error: `Provider ${targetProvider} is NOT_CONFIGURED (missing API key in environment).`,
          statusState: 'NOT_CONFIGURED',
        }, { status: 400 });
      }

      const settings = await aiRouter.getEffectiveSettings();
      const model = body?.model || aiRouter.getModelForProvider(targetProvider, settings);
      response = await provider.generate(messages, systemPrompt, {
        model,
        maxTokens: 300,
        timeoutMs: 15000,
      });
      aiRouter.markProviderOperational(targetProvider, true);
    } else {
      response = await aiRouter.generate(messages, systemPrompt, {
        maxTokens: 300,
        timeoutMs: 15000,
      });
      if (response.provider) {
        aiRouter.markProviderOperational(response.provider as AIProviderName, true);
      }
    }

    return NextResponse.json(
      {
        success: true,
        provider: response.provider,
        model: response.model,
        statusState: 'OPERATIONAL',
        latencyMs: Date.now() - start,
        textSnippet: response.text.slice(0, 300) + (response.text.length > 300 ? '...' : ''),
        retrievalUsed,
        sourcesCount: sources.length,
        sources: sources.map((s) => ({ title: s.title, domain: s.domain, url: s.url })),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message.replace(/([a-zA-Z0-9_\-]{20,})/g, '[REDACTED]')
        : 'Diagnostic test execution failed.';

    return NextResponse.json(
      {
        success: false,
        latencyMs: Date.now() - start,
        error: errorMsg,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
