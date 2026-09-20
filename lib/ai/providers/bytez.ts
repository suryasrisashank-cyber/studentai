import {
  AIProvider,
  AIProviderName,
  AIProviderStatus,
  AIResponse,
  ChatMessage,
  GenerationOptions,
  ProviderError,
} from '../types';
import { validateModelId } from '../models/catalog';

export class BytezAIProvider implements AIProvider {
  name: AIProviderName = 'bytez';

  isConfigured(): boolean {
    const key = process.env.BYTEZ_API_KEY?.trim();
    return Boolean(key && key.length > 0);
  }

  getStatus(model?: string): { status: AIProviderStatus } {
    if (!this.isConfigured()) {
      return { status: 'NOT_CONFIGURED' };
    }
    const targetModel = (model || process.env.AI_BYTEZ_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct').trim();
    if (!targetModel) {
      return { status: 'CONFIGURED' };
    }
    const validation = validateModelId('bytez', targetModel);
    if (!validation.valid) {
      return { status: 'UNAVAILABLE' };
    }
    return { status: 'AVAILABLE' };
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const apiKey = process.env.BYTEZ_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError('bytez', 'MISSING_KEY');
    }

    const model = (options?.model || process.env.AI_BYTEZ_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct').trim();
    const timeoutMs = options?.timeoutMs || 15000;
    const maxTokens = options?.maxTokens || 1500;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch('https://api.bytez.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
          'bytez-key': apiKey.replace(/^Bearer\s+/i, ''),
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      // If /v1 returns 404, fallback to /models/v2/openai/v1 endpoint
      if (res.status === 404) {
        res = await fetch('https://api.bytez.com/models/v2/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
            'bytez-key': apiKey.replace(/^Bearer\s+/i, ''),
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            max_tokens: maxTokens,
            temperature,
          }),
          signal: controller.signal,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('bytez', 'TIMEOUT');
      }
      throw new ProviderError('bytez', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new ProviderError('bytez', '401', 401);
      if (status === 403) throw new ProviderError('bytez', '403', 403);
      if (status === 404) throw new ProviderError('bytez', '404', 404);
      if (status === 429) throw new ProviderError('bytez', '429', 429);
      if (status >= 500) throw new ProviderError('bytez', '5XX', status);
      throw new ProviderError('bytez', `ERROR_${status}`, status);
    }

    try {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new ProviderError('bytez', 'EMPTY_RESPONSE');
      }

      return {
        text,
        provider: this.name,
        model,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError('bytez', 'PARSE_ERROR');
    }
  }

  async generateStream(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const apiKey = process.env.BYTEZ_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError('bytez', 'MISSING_KEY');
    }

    const model = (options?.model || process.env.AI_BYTEZ_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct').trim();
    const timeoutMs = options?.timeoutMs || 15000;
    const maxTokens = options?.maxTokens || 1500;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch('https://api.bytez.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
          'bytez-key': apiKey.replace(/^Bearer\s+/i, ''),
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (res.status === 404) {
        res = await fetch('https://api.bytez.com/models/v2/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
            'bytez-key': apiKey.replace(/^Bearer\s+/i, ''),
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            max_tokens: maxTokens,
            temperature,
            stream: true,
          }),
          signal: controller.signal,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('bytez', 'TIMEOUT');
      }
      throw new ProviderError('bytez', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new ProviderError('bytez', '401', 401);
      if (status === 403) throw new ProviderError('bytez', '403', 403);
      if (status === 404) throw new ProviderError('bytez', '404', 404);
      if (status === 429) throw new ProviderError('bytez', '429', 429);
      if (status >= 500) throw new ProviderError('bytez', '5XX', status);
      throw new ProviderError('bytez', `ERROR_${status}`, status);
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
          if (trimmed === 'data: [DONE]') continue;
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              onChunk?.(delta);
            }
          } catch {
            // Ignore parse errors on stream split
          }
        }
      }
    } catch {
      // Fall through to validation
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
