import {
  AIProvider,
  AIProviderName,
  AIProviderStatus,
  AIResponse,
  ChatMessage,
  GenerationOptions,
  ProviderError,
} from '../types';

export class ClaudeAIProvider implements AIProvider {
  name: AIProviderName = 'claude';

  isConfigured(): boolean {
    const key = (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)?.trim();
    return Boolean(key && key.length > 0);
  }

  getStatus(model?: string): { status: AIProviderStatus } {
    if (!this.isConfigured()) {
      return { status: 'NOT_CONFIGURED' };
    }
    return { status: 'AVAILABLE' };
  }

  private getApiKey(): string {
    const key = (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)?.trim();
    if (!key) {
      throw new ProviderError('claude', 'MISSING_KEY');
    }
    return key;
  }

  private formatMessages(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
    const formatted: { role: 'user' | 'assistant'; content: string }[] = [];

    for (const msg of messages) {
      const role: 'user' | 'assistant' = msg.role === 'assistant' ? 'assistant' : 'user';
      if (!msg.content || typeof msg.content !== 'string') continue;

      // Anthropic does not allow consecutive messages with identical roles
      const last = formatted[formatted.length - 1];
      if (last && last.role === role) {
        last.content += `\n\n${msg.content.trim()}`;
      } else {
        formatted.push({ role, content: msg.content.trim() });
      }
    }

    // Must start with user message for Anthropic
    if (formatted.length === 0 || formatted[0].role !== 'user') {
      formatted.unshift({ role: 'user', content: 'Hello' });
    }

    return formatted;
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    const model = (options?.model || process.env.AI_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022').trim();
    const timeoutMs = options?.timeoutMs || 25000;
    const maxTokens = options?.maxTokens || 2048;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();
    const formattedMessages = this.formatMessages(messages);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('claude', 'TIMEOUT');
      }
      throw new ProviderError('claude', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new ProviderError('claude', '401', 401);
      if (status === 403) throw new ProviderError('claude', '403', 403);
      if (status === 404) throw new ProviderError('claude', '404', 404);
      if (status === 429) throw new ProviderError('claude', '429', 429);
      if (status >= 500) throw new ProviderError('claude', '5XX', status);
      throw new ProviderError('claude', `ERROR_${status}`, status);
    }

    try {
      const data = await res.json();
      const text = data?.content?.map((item: any) => item.text || '').join('').trim() || '';

      if (!text) {
        throw new ProviderError('claude', 'EMPTY_RESPONSE');
      }

      return {
        text,
        provider: this.name,
        model,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError('claude', 'PARSE_ERROR');
    }
  }

  async generateStream(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    const model = (options?.model || process.env.AI_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022').trim();
    const timeoutMs = options?.timeoutMs || 25000;
    const maxTokens = options?.maxTokens || 2048;
    const temperature = options?.temperature ?? 0.7;

    const startTime = Date.now();
    const formattedMessages = this.formatMessages(messages);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('claude', 'TIMEOUT');
      }
      throw new ProviderError('claude', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new ProviderError('claude', '401', 401);
      if (status === 403) throw new ProviderError('claude', '403', 403);
      if (status === 404) throw new ProviderError('claude', '404', 404);
      if (status === 429) throw new ProviderError('claude', '429', 429);
      if (status >= 500) throw new ProviderError('claude', '5XX', status);
      throw new ProviderError('claude', `ERROR_${status}`, status);
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
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            let token = '';

            // Handle content_block_delta event
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              token = parsed.delta.text;
            }

            if (token) {
              fullText += token;
              if (onChunk) {
                onChunk(token);
              }
            }
          } catch {
            // Partial chunk ignore
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('claude', 'TIMEOUT');
      }
      throw new ProviderError('claude', 'STREAM_ERROR');
    }

    return {
      text: fullText,
      provider: this.name,
      model,
      latencyMs: Date.now() - startTime,
    };
  }
}
