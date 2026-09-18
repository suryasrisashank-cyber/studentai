import { AIProvider, AIResponse, ChatMessage, GenerationOptions } from '../types';

export class GoogleAIProvider implements AIProvider {
  name = 'google';

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY.trim().length > 0);
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key is not configured.');
    }

    const model = process.env.AI_GOOGLE_MODEL || 'gemini-2.5-flash';
    const timeoutMs = options?.timeoutMs || 15000;
    const maxTokens = options?.maxTokens || 1500;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();

    // Map messages to Google Gemini format (Gemini uses role 'user' and 'model')
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const status = res.status;
        let errorMessage = `Google API responded with status ${status}`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) {
            errorMessage = `${errorMessage}: ${errJson.error.message}`;
          }
        } catch {
          // Keep generic message
        }

        // If the model is 404 (e.g., gemini-2.5-flash retired by Google for new users), attempt fallback to gemini-flash-latest
        if (status === 404 && model !== 'gemini-flash-latest') {
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
          const fallbackRes = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents,
              generationConfig: {
                maxOutputTokens: maxTokens,
                temperature,
              },
            }),
            signal: controller.signal,
          });

          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const text = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              return {
                text,
                provider: this.name,
                model: 'gemini-flash-latest',
                latencyMs: Date.now() - startTime,
              };
            }
          }
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || '';

      if (!text) {
        throw new Error('Google API returned an empty response.');
      }

      return {
        text,
        provider: this.name,
        model,
        latencyMs: Date.now() - startTime,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
