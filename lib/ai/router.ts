import { AIProvider, AIResponse, ChatMessage, GenerationOptions, ProviderError, AISiteSettings } from './types';
import { GoogleAIProvider } from './providers/google';
import { GroqAIProvider } from './providers/groq';
import { OpenRouterAIProvider } from './providers/openrouter';
import { sanitizeAIOutput } from './security';
import { db } from '@/lib/db';
import { DEFAULT_MODELS } from './models/catalog';

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

  async getEffectiveSettings(): Promise<AISiteSettings> {
    const defaults: AISiteSettings = {
      enabled: true,
      primaryProvider: ((process.env.AI_PRIMARY_PROVIDER || 'google').trim().toLowerCase() as any) || 'google',
      secondaryProvider: ((process.env.AI_SECONDARY_PROVIDER || 'groq').trim().toLowerCase() as any) || 'groq',
      tertiaryProvider: ((process.env.AI_TERTIARY_PROVIDER || 'openrouter').trim().toLowerCase() as any) || 'openrouter',
      googleModel: process.env.AI_GOOGLE_MODEL || DEFAULT_MODELS.google,
      groqModel: process.env.AI_GROQ_MODEL || DEFAULT_MODELS.groq,
      openrouterModel: process.env.AI_OPENROUTER_MODEL || DEFAULT_MODELS.openrouter,
      retrievalEnabled: true,
      maxOutputTokens: 1500,
    };

    return await db.getSiteSetting('ai_settings', defaults);
  }

  async getFallbackChain(): Promise<string[]> {
    const settings = await this.getEffectiveSettings();
    const primary = (settings.primaryProvider || 'google').trim().toLowerCase();
    const secondary = (settings.secondaryProvider || 'groq').trim().toLowerCase();
    const tertiary = (settings.tertiaryProvider || 'openrouter').trim().toLowerCase();

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

  private getModelForProvider(providerName: string, settings: AISiteSettings, options?: GenerationOptions): string {
    if (options?.model) return options.model;
    if (providerName === 'google') return settings.googleModel || DEFAULT_MODELS.google;
    if (providerName === 'groq') return settings.groqModel || DEFAULT_MODELS.groq;
    if (providerName === 'openrouter') return settings.openrouterModel || DEFAULT_MODELS.openrouter;
    return '';
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const settings = await this.getEffectiveSettings();
    const chain = await this.getFallbackChain();
    let hasAttemptedAny = false;

    const maxTokens = options?.maxTokens || settings.maxOutputTokens || 1500;

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
      const model = this.getModelForProvider(providerName, settings, options);

      try {
        const response = await provider.generate(messages, systemPrompt, {
          ...options,
          model,
          maxTokens,
        });

        // Safe server-side observability log
        console.log(`[AIRouter] provider=${providerName} model=${response.model} status=SUCCESS latency=${response.latencyMs}ms fallbackUsed=${i > 0}`);

        // Record telemetry event in background
        db.recordUsageEvent({
          feature: 'ai-assistant',
          eventType: 'AI_CHAT_SUCCESS',
          metadataJson: {
            provider: providerName,
            model: response.model,
            latencyMs: response.latencyMs,
            fallbackUsed: i > 0,
          },
        }).catch(() => {});

        // Sanitize output to prevent any sensitive strings from leaving the server
        response.text = sanitizeAIOutput(response.text);

        return response;
      } catch (err: unknown) {
        const attemptLatency = Date.now() - attemptStart;
        const category =
          err instanceof ProviderError
            ? err.category
            : `${providerName.toUpperCase()}_ERROR`;

        // Safe diagnostic logging: provider, model, status/error category, latency only
        console.warn(`[AIRouter] provider=${providerName} model=${model} status=${category} latency=${attemptLatency}ms`);

        // Record failure event
        db.recordUsageEvent({
          feature: 'ai-assistant',
          eventType: 'AI_CHAT_FAILURE',
          metadataJson: {
            provider: providerName,
            model,
            category,
            latencyMs: attemptLatency,
          },
        }).catch(() => {});

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

  async generateStream(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const settings = await this.getEffectiveSettings();
    const chain = await this.getFallbackChain();
    let hasAttemptedAny = false;

    const maxTokens = options?.maxTokens || settings.maxOutputTokens || 1500;

    for (let i = 0; i < chain.length; i++) {
      const providerName = chain[i];
      const provider = this.providers.get(providerName);

      if (!provider) continue;

      if (!provider.isConfigured()) {
        continue;
      }

      hasAttemptedAny = true;
      const attemptStart = Date.now();
      const model = this.getModelForProvider(providerName, settings, options);

      try {
        let response: AIResponse;
        if (typeof provider.generateStream === 'function') {
          response = await provider.generateStream(
            messages,
            systemPrompt,
            { ...options, model, maxTokens },
            onChunk
          );
        } else {
          response = await provider.generate(messages, systemPrompt, {
            ...options,
            model,
            maxTokens,
          });
          if (response.text) onChunk?.(response.text);
        }

        console.log(`[AIRouter] stream provider=${providerName} model=${response.model} status=SUCCESS latency=${response.latencyMs}ms fallbackUsed=${i > 0}`);

        db.recordUsageEvent({
          feature: 'ai-assistant',
          eventType: 'AI_CHAT_STREAM_SUCCESS',
          metadataJson: {
            provider: providerName,
            model: response.model,
            latencyMs: response.latencyMs,
            fallbackUsed: i > 0,
          },
        }).catch(() => {});

        response.text = sanitizeAIOutput(response.text);
        return response;

      } catch (err: unknown) {
        const attemptLatency = Date.now() - attemptStart;
        const category =
          err instanceof ProviderError
            ? err.category
            : `${providerName.toUpperCase()}_ERROR`;

        console.warn(`[AIRouter] stream provider=${providerName} model=${model} status=${category} latency=${attemptLatency}ms`);
      }
    }

    throw new Error(
      'StudentAI Assistant is temporarily unable to process your request. Please wait a moment and try again.'
    );
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();
