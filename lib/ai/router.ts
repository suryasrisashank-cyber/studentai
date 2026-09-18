import { AIProvider, AIResponse, ChatMessage, GenerationOptions, ProviderError } from './types';
import { GoogleAIProvider } from './providers/google';
import { GroqAIProvider } from './providers/groq';
import { OpenRouterAIProvider } from './providers/openrouter';
import { sanitizeAIOutput } from './security';

export class AIRouter {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    const google = new GoogleAIProvider();
    const groq = new GroqAIProvider();
    const openrouter = new OpenRouterAIProvider();

    this.providers.set(google.name, google);
    this.providers.set(groq.name, groq);
    this.providers.set(openrouter.name, openrouter);
  }

  getProviderStatus(): { google: boolean; groq: boolean; openrouter: boolean } {
    return {
      google: this.providers.get('google')?.isConfigured() ?? false,
      groq: this.providers.get('groq')?.isConfigured() ?? false,
      openrouter: this.providers.get('openrouter')?.isConfigured() ?? false,
    };
  }

  getFallbackChain(): string[] {
    const primary = (process.env.AI_PRIMARY_PROVIDER || 'google').trim().toLowerCase();
    const secondary = (process.env.AI_SECONDARY_PROVIDER || 'groq').trim().toLowerCase();
    const tertiary = (process.env.AI_TERTIARY_PROVIDER || 'openrouter').trim().toLowerCase();

    // Deduplicate while preserving configured priority order
    const chain: string[] = [];
    for (const p of [primary, secondary, tertiary]) {
      if (this.providers.has(p) && !chain.includes(p)) {
        chain.push(p);
      }
    }

    // Include any remaining registered providers as safety net
    this.providers.forEach((_, name) => {
      if (!chain.includes(name)) {
        chain.push(name);
      }
    });

    return chain;
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const chain = this.getFallbackChain();
    let hasAttemptedAny = false;

    for (let i = 0; i < chain.length; i++) {
      const providerName = chain[i];
      const provider = this.providers.get(providerName);

      if (!provider) continue;

      if (!provider.isConfigured()) {
        console.warn(`[AIRouter] provider=${providerName} status=${providerName.toUpperCase()}_MISSING_KEY latency=0ms`);
        continue;
      }

      hasAttemptedAny = true;
      const attemptStart = Date.now();

      try {
        const response = await provider.generate(messages, systemPrompt, options);

        // Safe server-side observability log
        console.log(`[AIRouter] provider=${providerName} status=SUCCESS latency=${response.latencyMs}ms`);

        // Sanitize output to prevent any sensitive strings from leaving the server
        response.text = sanitizeAIOutput(response.text);

        return response;
      } catch (err: unknown) {
        const attemptLatency = Date.now() - attemptStart;
        const category =
          err instanceof ProviderError
            ? err.category
            : `${providerName.toUpperCase()}_ERROR`;

        // Safe diagnostic logging: provider, status/error category, latency only
        console.warn(`[AIRouter] provider=${providerName} status=${category} latency=${attemptLatency}ms`);
      }
    }

    if (!hasAttemptedAny) {
      console.warn('[AIRouter] status=ALL_PROVIDERS_UNCONFIGURED');
    }

    // Friendly student-facing message without internal infrastructure leaks
    throw new Error(
      'StudentAI Assistant is temporarily unable to process your request. Please wait a moment and try again.'
    );
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();
