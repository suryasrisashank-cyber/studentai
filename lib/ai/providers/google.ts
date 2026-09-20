import { AIProvider, AIProviderName, AIProviderStatus, AIResponse, ChatMessage, GenerationOptions, ProviderError } from '../types';

export class GoogleAIProvider implements AIProvider {
  name: AIProviderName = 'google';

  isConfigured(): boolean {
    const key = process.env.GOOGLE_AI_API_KEY?.trim();
    return Boolean(key && key.length > 0);
  }

  getStatus(model?: string): { status: AIProviderStatus } {
    if (!this.isConfigured()) {
      return { status: 'NOT_CONFIGURED' };
    }
    const targetModel = (model || process.env.AI_GOOGLE_MODEL || 'gemini-3.6-flash').trim();
    return { status: 'AVAILABLE' };
  }

  private formatContents(messages: ChatMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
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

    if (contents.length === 0 || contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    return contents;
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

    const model = (options?.model || process.env.AI_GOOGLE_MODEL || 'gemini-3.6-flash').trim();
    const timeoutMs = options?.timeoutMs || 12000;
    const maxTokens = options?.maxTokens || 1500;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();
    const contents = this.formatContents(messages);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('google', 'TIMEOUT');
      }
      throw new ProviderError('google', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
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
        model,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError('google', 'PARSE_ERROR');
    }
  }

  async generateStream(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError('google', 'MISSING_KEY');
    }

    const model = (options?.model || process.env.AI_GOOGLE_MODEL || 'gemini-3.6-flash').trim();
    const timeoutMs = options?.timeoutMs || 15000;
    const maxTokens = options?.maxTokens || 1500;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();
    const contents = this.formatContents(messages);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('google', 'TIMEOUT');
      }
      throw new ProviderError('google', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
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

    let fullText = '';
    const reader = res.body?.getReader();
    if (!reader) {
      return this.generate(messages, systemPrompt, options);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const partText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (partText) {
              fullText += partText;
              onChunk?.(partText);
            }
          } catch {
            // Ignore partial SSE chunks
          }
        }
      }
    } catch {
      // Fall through to fullText validation
    }

    if (!fullText) {
      return this.generate(messages, systemPrompt, options);
    }

    return {
      text: fullText,
      provider: this.name,
      model,
      latencyMs: Date.now() - startTime,
    };
  }
}
