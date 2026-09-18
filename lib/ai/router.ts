import { AIProvider, AIResponse, ChatMessage, GenerationOptions } from './types';
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
    const primary = (process.env.AI_PRIMARY_PROVIDER || 'google').toLowerCase();
    const secondary = (process.env.AI_SECONDARY_PROVIDER || 'groq').toLowerCase();
    const tertiary = (process.env.AI_TERTIARY_PROVIDER || 'openrouter').toLowerCase();

    // Deduplicate while preserving order
    const chain: string[] = [];
    for (const p of [primary, secondary, tertiary]) {
      if (this.providers.has(p) && !chain.includes(p)) {
        chain.push(p);
      }
    }

    // Include any remaining known providers as safety net
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
    const attemptErrors: string[] = [];

    for (let i = 0; i < chain.length; i++) {
      const providerName = chain[i];
      const provider = this.providers.get(providerName);

      if (!provider || !provider.isConfigured()) {
        attemptErrors.push(`${providerName} is not configured.`);
        continue;
      }

      try {
        const response = await provider.generate(messages, systemPrompt, options);

        // Sanitize output to prevent any sensitive strings from leaving the server
        response.text = sanitizeAIOutput(response.text);

        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // Privacy-conscious server logging without leaking keys or user messages
        console.warn(`[AIRouter] Provider "${providerName}" failed: ${message}. Falling back...`);
        attemptErrors.push(`${providerName}: ${message}`);
      }
    }

    // All configured providers in fallback chain failed
    throw new Error(
      'StudentAI Assistant is temporarily unable to process your request. Please wait a moment and try again.'
    );
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();
