import { AIProvider, AIResponse, ChatMessage, GenerationOptions, ProviderError } from '../types';

export class GroqAIProvider implements AIProvider {
  name = 'groq';

  isConfigured(): boolean {
    const key = process.env.GROQ_API_KEY?.trim();
    return Boolean(key && key.length > 0);
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError('groq', 'MISSING_KEY');
    }

    const model = (process.env.AI_GROQ_MODEL || 'openai/gpt-oss-120b').trim();
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
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('groq', 'TIMEOUT');
      }
      throw new ProviderError('groq', 'NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const status = res.status;
      if (status === 401) throw new ProviderError('groq', '401', 401);
      if (status === 403) throw new ProviderError('groq', '403', 403);
      if (status === 404) throw new ProviderError('groq', '404', 404);
      if (status === 429) throw new ProviderError('groq', '429', 429);
      if (status >= 500) throw new ProviderError('groq', '5XX', status);
      throw new ProviderError('groq', `ERROR_${status}`, status);
    }

    try {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new ProviderError('groq', 'EMPTY_RESPONSE');
      }

      return {
        text,
        provider: this.name,
        model,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError('groq', 'PARSE_ERROR');
    }
  }
}
