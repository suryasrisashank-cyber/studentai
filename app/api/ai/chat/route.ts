import { NextRequest, NextResponse } from 'next/server';
import { validateAIRequest } from '@/lib/ai/security';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { aiRouter } from '@/lib/ai/router';
import { ChatMessage } from '@/lib/ai/types';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 0. Check Platform Maintenance & AI Kill Switch from persistent store
    const [maintenance, aiSettings] = await Promise.all([
      db.getSiteSetting('maintenance_mode', { enabled: false, message: '' }),
      db.getSiteSetting('ai_settings', { enabled: true }),
    ]);

    if (maintenance.enabled) {
      return NextResponse.json(
        {
          error:
            maintenance.message ||
            'StudentAI Assistant is temporarily unavailable due to scheduled platform maintenance. Please check back shortly.',
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!aiSettings.enabled) {
      return NextResponse.json(
        {
          error:
            'The AI Assistant has been temporarily paused by the administrator. Please check back shortly or explore our 20 client-side tools.',
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 1. Content-Type Validation
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid Content-Type. Expected application/json.' },
        { status: 415 }
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
          error: "You're sending messages too quickly. Please wait a moment and try again.",
          retryAfter: rateLimit.retryAfterSeconds,
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
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Malformed JSON payload in request.' },
        { status: 400 }
      );
    }

    const validation = validateAIRequest(rawBody);
    if (!validation.valid || !validation.sanitizedRequest) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request parameters.' },
        { status: 400 }
      );
    }

    const { message, history = [], mode = 'general' } = validation.sanitizedRequest;

    // 4. Construct Full Context (History + New User Message)
    const systemPrompt = buildSystemPrompt(mode);
    const messages: ChatMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    // 5. Invoke Multi-Provider Gateway with Fallback
    const response = await aiRouter.generate(messages, systemPrompt);

    return NextResponse.json(
      {
        text: response.text,
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
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

    return NextResponse.json(
      { error: message },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
