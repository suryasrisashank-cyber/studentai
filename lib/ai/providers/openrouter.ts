import { AIProvider, AIResponse, ChatMessage, GenerationOptions } from '../types';

export class OpenRouterAIProvider implements AIProvider {
  name = 'openrouter';

  isConfigured(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0);
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    const model = process.env.AI_OPENROUTER_MODEL || 'openrouter/free';
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

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://studentai-five.vercel.app',
          'X-Title': 'StudentAI',
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const status = res.status;
        let errorMessage = `OpenRouter API responded with status ${status}`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) {
            errorMessage = `${errorMessage}: ${errJson.error.message}`;
          }
        } catch {
          // Keep generic message
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('OpenRouter API returned an empty response.');
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
