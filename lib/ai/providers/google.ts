import { AIProvider, AIResponse, ChatMessage, GenerationOptions, ProviderError } from '../types';

export class GoogleAIProvider implements AIProvider {
  name = 'google';

  isConfigured(): boolean {
    const key = process.env.GOOGLE_AI_API_KEY?.trim();
    return Boolean(key && key.length > 0);
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError('google', 'MISSING_KEY');
    }

    const model = (process.env.AI_GOOGLE_MODEL || 'gemini-2.5-flash').trim();
    const timeoutMs = options?.timeoutMs || 5000;
    const maxTokens = options?.maxTokens || 1500;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();

    // Map messages to Google Gemini format ensuring valid alternating roles
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const m of messages) {
      const text = m.content.trim();
      if (!text) continue;
      const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n' + text;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }

    // Gemini requires at least one user content
    if (contents.length === 0 || contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const executeCall = async (targetModel: string): Promise<Response> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        return await fetch(url, {
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
      } finally {
        clearTimeout(timer);
      }
    };

    let res: Response;
    let usedModel = model;

    try {
      res = await executeCall(model);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('google', 'TIMEOUT');
      }
      throw new ProviderError('google', 'NETWORK_ERROR');
    }

    // If model is 404 (e.g. gemini-2.5-flash deprecated/unavailable), attempt fallback to gemini-3.6-flash
    if (res.status === 404 && model !== 'gemini-3.6-flash') {
      try {
        const fallbackRes = await executeCall('gemini-3.6-flash');
        res = fallbackRes;
        if (fallbackRes.ok) {
          usedModel = 'gemini-3.6-flash';
        }
      } catch {
        // Fall through to standard error handling
      }
    }

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new ProviderError('google', '401', 401);
      if (status === 403) throw new ProviderError('google', '403', 403);
      if (status === 404) throw new ProviderError('google', '404', 404);
      if (status === 429) throw new ProviderError('google', '429', 429);
      if (status >= 500) throw new ProviderError('google', '5XX', status);
      throw new ProviderError('google', `ERROR_${status}`, status);
    }

    try {
      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || '';

      if (!text) {
        throw new ProviderError('google', 'EMPTY_RESPONSE');
      }

      return {
        text,
        provider: this.name,
        model: usedModel,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError('google', 'PARSE_ERROR');
    }
  }
}
