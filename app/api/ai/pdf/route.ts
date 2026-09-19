import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiRouter } from '@/lib/ai/router';
import { ChatMessage } from '@/lib/ai/types';
import { checkRateLimit } from '@/lib/ai/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Check Platform Maintenance & Global AI Kill Switch
    const [maintenance, aiSettings] = await Promise.all([
      db.getSiteSetting('maintenance_mode', { enabled: false, message: '' }),
      db.getSiteSetting('ai_settings', { enabled: true }),
    ]);

    if (maintenance.enabled) {
      return NextResponse.json(
        {
          error:
            maintenance.message ||
            'StudentAI PDF Assistant is temporarily unavailable due to scheduled platform maintenance. Please check back shortly.',
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!aiSettings.enabled) {
      return NextResponse.json(
        {
          error:
            'The AI Assistant has been temporarily paused by the administrator. Please check back shortly or explore our client-side PDF utilities.',
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 2. Client Identifier & Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "You're sending requests too quickly. Please wait a moment and try again.",
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

    // 3. Parse JSON body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
    }

    const { action = 'summarize', text = '', format = 'concise', targetLanguage = 'English' } = body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document contains no extractable text or text payload was empty.' },
        { status: 400 }
      );
    }

    // Truncate to maximum configured length to protect against abuse
    const sanitizedText = text.trim().slice(0, 30000);

    // 4. Construct System Prompt & Instructions based on action
    let systemPrompt =
      'You are StudentAI, an expert educational AI assistant. You analyze academic PDFs and study documents for students with high accuracy, clarity, and pedagogical focus.';
    let userPrompt = '';

    if (action === 'summarize') {
      if (format === 'exam-prep') {
        userPrompt = `Analyze the following academic document and generate comprehensive EXAM-FOCUSED STUDY NOTES:\n1. Key Conceptual Highlights\n2. Likely Exam Questions & Detailed Answers\n3. Critical Formulas/Definitions\n\nDOCUMENT TEXT:\n${sanitizedText}`;
      } else if (format === 'key-points') {
        userPrompt = `Extract the top 10 most critical KEY TAKEAWAYS and bullet points from this document:\n\nDOCUMENT TEXT:\n${sanitizedText}`;
      } else if (format === 'detailed') {
        userPrompt = `Provide an in-depth, structured academic SUMMARY of this document, organized by major topics with explanations:\n\nDOCUMENT TEXT:\n${sanitizedText}`;
      } else {
        userPrompt = `Provide a clean, concise, 3-4 paragraph EXECUTIVE SUMMARY of the following document:\n\nDOCUMENT TEXT:\n${sanitizedText}`;
      }
    } else if (action === 'translate') {
      systemPrompt = `You are a professional academic translator. Translate the following study document content into ${targetLanguage}. Preserve original terminology, formulas, and structural readability.`;
      userPrompt = `Translate the following text accurately into ${targetLanguage}:\n\n${sanitizedText}`;
    } else if (action === 'markdown') {
      systemPrompt =
        'You are a technical document formatter. Convert the provided extracted PDF text into clean, structured GitHub Flavored Markdown. Use proper headers (#, ##, ###), lists, tables where apparent, and code blocks.';
      userPrompt = `Convert the following extracted PDF text into well-formatted Markdown:\n\n${sanitizedText}`;
    } else if (action === 'exam-questions') {
      userPrompt = `Based solely on the following document, create 5 multiple choice questions and 3 conceptual short-answer questions with detailed answer explanations for students:\n\nDOCUMENT TEXT:\n${sanitizedText}`;
    } else {
      userPrompt = `Analyze and explain the core concepts of this document for a student:\n\nDOCUMENT TEXT:\n${sanitizedText}`;
    }

    const messages: ChatMessage[] = [{ role: 'user', content: userPrompt }];

    // 5. Invoke Multi-Provider Gateway (Google -> Groq -> OpenRouter)
    const response = await aiRouter.generate(messages, systemPrompt);

    // 6. Record anonymous telemetry event
    try {
      await db.recordUsageEvent({
        eventType: 'AI_REQUEST',
        feature: `pdf_${action}`,
        metadataJson: {
          charCount: sanitizedText.length,
          provider: response.provider,
          model: response.model,
        },
      });
    } catch {
      // Telemetry error does not block user response
    }

    return NextResponse.json(
      {
        success: true,
        text: response.text,
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'The AI service could not complete this request. Please try again shortly.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
