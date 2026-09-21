import { NextRequest, NextResponse } from 'next/server';
import { validateAIRequest } from '@/lib/ai/security';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { aiRouter } from '@/lib/ai/router';
import { ChatMessage, SourceCitation, AIErrorCode } from '@/lib/ai/types';
import { analyzeUserQuery } from '@/lib/ai/retrieval/freshness';
import { retrieveCurrentData } from '@/lib/ai/retrieval/search';
import { db } from '@/lib/db';
import { requireAiAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

function formatErrorResponse(code: AIErrorCode, message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        status,
        ...(details ? { details } : {}),
      },
    },
    { status, headers: { 'Cache-Control': 'no-store, no-cache' } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 0. Check Platform Maintenance & AI Kill Switch from persistent store
    const [maintenance, dbAiSettings] = await Promise.all([
      db.getSiteSetting('maintenance_mode', { enabled: false, message: '' }),
      db.getSiteSetting('ai_settings', null),
    ]);
    const aiSettings = await aiRouter.getEffectiveSettings();

    if (maintenance.enabled) {
      return formatErrorResponse(
        'AI_DISABLED',
        maintenance.message || 'StudentAI Assistant is temporarily unavailable due to scheduled platform maintenance. Please check back shortly.',
        503
      );
    }

    if (!aiSettings.enabled || aiSettings.globalKillSwitch) {
      return formatErrorResponse(
        'AI_DISABLED',
        'The AI Assistant has been temporarily paused by the administrator. Please check back shortly or explore our client-side tools.',
        503
      );
    }

    // 0.1 Enforce Mandatory Supabase Authentication for all AI chat/generation requests
    const auth = await requireAiAuth(req);
    if (!auth.authenticated || !auth.user) {
      return auth.errorResponse!;
    }

    // 1. Content-Type Validation
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return formatErrorResponse(
        'AI_INVALID_REQUEST',
        'Invalid Content-Type. Expected application/json.',
        415
      );
    }

    // 2. Client Identifier & Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'AI_RATE_LIMITED' as AIErrorCode,
            message: "You're sending messages too quickly. Please wait a moment and try again.",
            status: 429,
            retryAfter: rateLimit.retryAfterSeconds,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds || 60),
            'Cache-Control': 'no-store, no-cache',
          },
        }
      );
    }

    // 3. Request Body & Schema Validation
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      return formatErrorResponse(
        'AI_INVALID_REQUEST',
        'Malformed JSON payload in request.',
        400
      );
    }

    const validation = validateAIRequest(rawBody);
    if (!validation.valid || !validation.sanitizedRequest) {
      const code: AIErrorCode = validation.error?.toLowerCase().includes('length') || validation.error?.toLowerCase().includes('large')
        ? 'AI_CONTEXT_TOO_LARGE'
        : 'AI_INVALID_REQUEST';
      return formatErrorResponse(
        code,
        validation.error || 'Invalid request parameters.',
        400
      );
    }

    const { message, history = [], mode = 'general' } = validation.sanitizedRequest;
    const shouldStream = Boolean(rawBody?.stream);

    // 4. Intent Classification & Real-Time Web Retrieval
    const analysis = analyzeUserQuery(message);
    let sources: SourceCitation[] = [];
    let groundedContext = '';
    let retrievalUsed = false;

    if (analysis.requiresFreshness && aiSettings.retrievalEnabled) {
      try {
        const retrieval = await retrieveCurrentData(analysis.searchQuery);
        if (retrieval.retrievalUsed && retrieval.sources.length > 0) {
          sources = retrieval.sources;
          groundedContext = retrieval.groundedPromptContext;
          retrievalUsed = true;
        }
      } catch (err) {
        console.warn('[AI Retrieval] Failed to retrieve external data:', err);
      }
    }

    // 5. Construct Full Prompt Context
    const systemPrompt = buildSystemPrompt(mode, groundedContext);
    const messages: ChatMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    // 6. Handle Streaming Response if requested
    if (shouldStream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send metadata event first (intent, retrieval, sources)
            const metaEvent = `data: ${JSON.stringify({
              type: 'metadata',
              intent: analysis.intent,
              retrievalUsed,
              sources,
            })}\n\n`;
            controller.enqueue(encoder.encode(metaEvent));

            // Stream tokens as they arrive
            const response = await aiRouter.generateStream(
              messages,
              systemPrompt,
              { maxTokens: aiSettings.maxOutputTokens },
              (chunk) => {
                const chunkEvent = `data: ${JSON.stringify({
                  type: 'chunk',
                  text: chunk,
                })}\n\n`;
                controller.enqueue(encoder.encode(chunkEvent));
              }
            );

            // Send done event
            const doneEvent = `data: ${JSON.stringify({
              type: 'done',
              provider: response.provider,
              model: response.model,
              latencyMs: response.latencyMs,
            })}\n\n`;
            controller.enqueue(encoder.encode(doneEvent));
            controller.close();
          } catch (err: unknown) {
            const errorMsg =
              err instanceof Error
                ? err.message
                : 'StudentAI Assistant encountered an issue processing your stream.';
            const isTimeout = errorMsg.toLowerCase().includes('timeout');
            const code: AIErrorCode = isTimeout ? 'AI_TIMEOUT' : 'AI_PROVIDER_UNAVAILABLE';
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              code,
              error: errorMsg,
            })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // 7. Non-Streaming JSON Response (Preserves standard API contract)
    const response = await aiRouter.generate(messages, systemPrompt, {
      maxTokens: aiSettings.maxOutputTokens,
    });

    return NextResponse.json(
      {
        text: response.text,
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
        intent: analysis.intent,
        retrievalUsed,
        sources,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'StudentAI Assistant is temporarily unavailable. Please try again shortly.';

    const isTimeout = message.toLowerCase().includes('timeout');
    const isKillSwitch = message.startsWith('AI_DISABLED');
    const code: AIErrorCode = isKillSwitch
      ? 'AI_DISABLED'
      : isTimeout
      ? 'AI_TIMEOUT'
      : 'AI_PROVIDER_UNAVAILABLE';

    const status = isKillSwitch ? 503 : isTimeout ? 504 : 502;
    return formatErrorResponse(code, message, status);
  }
}
