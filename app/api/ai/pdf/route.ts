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

    const {
      action = 'summarize',
      text = '',
      format = 'concise',
      length,
      level = 'undergrad',
      questions = 8,
      style = 'faithful',
      targetLanguage = 'English',
      question = '',
      messages: inputMessages,
    } = body || {};

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
    let messages: ChatMessage[] = [];

    if (action === 'summarize') {
      const summaryLength = length || (format === 'concise' ? 'medium' : format === 'detailed' ? 'long' : 'short');
      let depthDesc = 'Write a short summary, then a bulleted list of the key points, then any terms a student would need defined.';
      if (summaryLength === 'short') {
        depthDesc = 'Write one tight paragraph covering only the single most important idea.';
      } else if (summaryLength === 'long') {
        depthDesc = 'Work through the document section by section. For each section give a heading and three or four sentences. End with the overall takeaway.';
      }
      messages = [
        {
          role: 'user',
          content: `You are helping a student understand a document. ${depthDesc} Answer in ${targetLanguage}. Do not invent anything that is not in the text.\n\n---\nDOCUMENT TEXT:\n${sanitizedText}`,
        },
      ];
    } else if (action === 'study-guide') {
      systemPrompt =
        'You are an expert tutor creating structured, rigorous study and revision guides for students.';
      const instruction = `Turn this material into a revision guide for a ${level} student, in ${targetLanguage}.

Use exactly these sections:
## Core ideas
## Key terms
(term followed by a one-line definition)
## Things students get wrong
## Practice questions
(${questions} questions, numbered, with the answer indented under each one)

Use only what is in the text. If something is not covered, say so rather than filling it in.

---
DOCUMENT TEXT:
${sanitizedText}`;
      messages = [{ role: 'user', content: instruction }];
    } else if (action === 'translate') {
      const how =
        style === 'simple'
          ? `Translate into ${targetLanguage}, simplifying the language so a learner can follow it. Keep all facts intact.`
          : `Translate into ${targetLanguage}, staying close to the original wording and keeping technical terms accurate.`;
      systemPrompt = `You are a professional academic translator. ${how} Keep the [page N] markers exactly as they are. Output only the translation.`;
      messages = [
        {
          role: 'user',
          content: `${how} Keep the [page N] markers exactly as they are. Output only the translation.\n\n---\nDOCUMENT TEXT:\n${sanitizedText}`,
        },
      ];
    } else if (action === 'chat') {
      systemPrompt = `You answer questions about one document only. Its text follows.
Answer using the document. If the answer is not in it, say plainly that the document does not cover it — never guess. Cite page numbers from the [page N] markers when you can. Keep answers short unless asked for detail.

DOCUMENT:
${sanitizedText}`;

      if (Array.isArray(inputMessages) && inputMessages.length > 0) {
        messages = inputMessages.map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
          content: m.content || m.text || '',
        }));
      } else if (question) {
        messages = [{ role: 'user', content: question }];
      } else {
        messages = [{ role: 'user', content: 'What are the main topics and takeaways from this document?' }];
      }
    } else if (action === 'markdown') {
      systemPrompt =
        'You are a technical document formatter. Convert the provided extracted PDF text into clean, structured GitHub Flavored Markdown. Use proper headers (#, ##, ###), lists, tables where apparent, and code blocks.';
      messages = [
        {
          role: 'user',
          content: `Convert the following extracted PDF text into well-formatted Markdown:\n\n${sanitizedText}`,
        },
      ];
    } else if (action === 'exam-questions') {
      messages = [
        {
          role: 'user',
          content: `Based solely on the following document, create 5 multiple choice questions and 3 conceptual short-answer questions with detailed answer explanations for students:\n\nDOCUMENT TEXT:\n${sanitizedText}`,
        },
      ];
    } else {
      messages = [
        {
          role: 'user',
          content: `Analyze and explain the core concepts of this document for a student:\n\nDOCUMENT TEXT:\n${sanitizedText}`,
        },
      ];
    }

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
