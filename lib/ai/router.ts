import {
  AIProvider,
  AIProviderName,
  AIProviderStatus,
  AIResponse,
  ChatMessage,
  GenerationOptions,
  ProviderError,
  AISiteSettings,
} from './types';
import { GoogleAIProvider } from './providers/google';
import { GroqAIProvider } from './providers/groq';
import { OpenRouterAIProvider } from './providers/openrouter';
import { BytezAIProvider } from './providers/bytez';
import { AtriaAIProvider } from './providers/atria';
import { sanitizeAIOutput } from './security';
import { db } from '@/lib/db';
import { DEFAULT_MODELS, validateModelId } from './models/catalog';

export class AIRouter {
  private providers: Map<AIProviderName, AIProvider> = new Map();
  private operationalCache: Map<AIProviderName, { isOperational: boolean; checkedAt: number }> = new Map();

  constructor() {
    const google = new GoogleAIProvider();
    const groq = new GroqAIProvider();
    const openrouter = new OpenRouterAIProvider();
    const bytez = new BytezAIProvider();
    const atria = new AtriaAIProvider();

    this.providers.set(google.name, google);
    this.providers.set(groq.name, groq);
    this.providers.set(openrouter.name, openrouter);
    this.providers.set(bytez.name, bytez);
    this.providers.set(atria.name, atria);
  }

  getProvider(name: AIProviderName): AIProvider | undefined {
    return this.providers.get(name);
  }

  getProviderStatus(): Record<AIProviderName, boolean> {
    return {
      google: this.providers.get('google')?.isConfigured() ?? false,
      groq: this.providers.get('groq')?.isConfigured() ?? false,
      openrouter: this.providers.get('openrouter')?.isConfigured() ?? false,
      bytez: this.providers.get('bytez')?.isConfigured() ?? false,
      atria: this.providers.get('atria')?.isConfigured() ?? false,
    };
  }

  getProviderState(providerName: AIProviderName, modelId?: string): {
    status: AIProviderStatus;
    configured: boolean;
    available: boolean;
    operational: boolean;
  } {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return { status: 'NOT_CONFIGURED', configured: false, available: false, operational: false };
    }

    const configured = provider.isConfigured();
    if (!configured) {
      return { status: 'NOT_CONFIGURED', configured: false, available: false, operational: false };
    }

    const targetModel = modelId || DEFAULT_MODELS[providerName];
    const validation = validateModelId(providerName, targetModel);
    const available = validation.valid;

    // Check if verified operational or failed within the last 15 minutes
    const cached = this.operationalCache.get(providerName);
    const hasRecentCheck = Boolean(cached && Date.now() - cached.checkedAt < 15 * 60 * 1000);
    const isOperational = Boolean(hasRecentCheck && cached?.isOperational === true);
    const isFailed = Boolean(hasRecentCheck && cached?.isOperational === false);

    let status: AIProviderStatus;
    if (isOperational) {
      status = 'OPERATIONAL';
    } else if (isFailed) {
      status = 'FAILED';
    } else if (!available) {
      status = 'UNAVAILABLE';
    } else if (available) {
      status = 'AVAILABLE';
    } else {
      status = 'CONFIGURED';
    }

    return {
      status,
      configured,
      available,
      operational: isOperational,
    };
  }

  markProviderOperational(providerName: AIProviderName, operational: boolean) {
    this.operationalCache.set(providerName, {
      isOperational: operational,
      checkedAt: Date.now(),
    });
  }

  async getEffectiveSettings(): Promise<AISiteSettings> {
    const defaults: AISiteSettings = {
      enabled: true,
      globalKillSwitch: false,
      primaryProvider: ((process.env.AI_PRIMARY_PROVIDER || 'google').trim().toLowerCase() as AIProviderName) || 'google',
      secondaryProvider: ((process.env.AI_SECONDARY_PROVIDER || 'groq').trim().toLowerCase() as AIProviderName) || 'groq',
      tertiaryProvider: ((process.env.AI_TERTIARY_PROVIDER || 'openrouter').trim().toLowerCase() as AIProviderName) || 'openrouter',
      providerPriority: ['google', 'groq', 'openrouter', 'bytez', 'atria'],
      googleModel: process.env.AI_GOOGLE_MODEL || DEFAULT_MODELS.google,
      groqModel: process.env.AI_GROQ_MODEL || DEFAULT_MODELS.groq,
      openrouterModel: process.env.AI_OPENROUTER_MODEL || DEFAULT_MODELS.openrouter,
      bytezModel: process.env.AI_BYTEZ_MODEL || DEFAULT_MODELS.bytez,
      atriaModel: process.env.AI_ATRIA_MODEL || DEFAULT_MODELS.atria,
      retrievalEnabled: true,
      maxOutputTokens: 1500,
      providerTimeouts: {
        google: 15000,
        groq: 15000,
        openrouter: 15000,
        bytez: 15000,
        atria: 15000,
      },
      providerTokenLimits: {
        google: 2000,
        groq: 2000,
        openrouter: 2000,
        bytez: 2000,
        atria: 2000,
      },
      rateLimitPerMinute: 20,
      dailyQuotaPerIp: 100,
    };

    return await db.getSiteSetting('ai_settings', defaults);
  }

  async getFallbackChain(): Promise<AIProviderName[]> {
    const settings = await this.getEffectiveSettings();

    // Priority ordering from settings
    const priorityList: AIProviderName[] = settings.providerPriority && settings.providerPriority.length > 0
      ? settings.providerPriority
      : [settings.primaryProvider, settings.secondaryProvider, settings.tertiaryProvider, 'bytez' as const, 'atria' as const];

    const chain: AIProviderName[] = [];
    for (const p of priorityList) {
      if (this.providers.has(p) && !chain.includes(p)) {
        chain.push(p);
      }
    }

    // Ensure all 5 providers exist in chain as fallback
    const allProviders: AIProviderName[] = ['google', 'groq', 'openrouter', 'bytez', 'atria'];
    for (const p of allProviders) {
      if (this.providers.has(p) && !chain.includes(p)) {
        chain.push(p);
      }
    }

    return chain;
  }

  getModelForProvider(providerName: AIProviderName, settings: AISiteSettings, options?: GenerationOptions): string {
    if (options?.model) return options.model;
    if (providerName === 'google') return settings.googleModel || DEFAULT_MODELS.google;
    if (providerName === 'groq') return settings.groqModel || DEFAULT_MODELS.groq;
    if (providerName === 'openrouter') return settings.openrouterModel || DEFAULT_MODELS.openrouter;
    if (providerName === 'bytez') return settings.bytezModel || DEFAULT_MODELS.bytez;
    if (providerName === 'atria') return settings.atriaModel || DEFAULT_MODELS.atria;
    return '';
  }

  getTimeoutForProvider(providerName: AIProviderName, settings: AISiteSettings, options?: GenerationOptions): number {
    if (options?.timeoutMs) return options.timeoutMs;
    const configured = settings.providerTimeouts?.[providerName];
    return configured && configured > 0 ? configured : 15000;
  }

  getTokenLimitForProvider(providerName: AIProviderName, settings: AISiteSettings, options?: GenerationOptions): number {
    if (options?.maxTokens) return options.maxTokens;
    const configured = settings.providerTokenLimits?.[providerName];
    if (configured && configured > 0) return configured;
    return settings.maxOutputTokens || 1500;
  }

  async generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse> {
    const settings = await this.getEffectiveSettings();

    // Check Kill Switch
    if (!settings.enabled || settings.globalKillSwitch) {
      throw new Error('AI_DISABLED: The StudentAI Assistant is currently paused by administrators for scheduled maintenance.');
    }

    const chain = await this.getFallbackChain();
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
      const model = this.getModelForProvider(providerName, settings, options);
      const maxTokens = this.getTokenLimitForProvider(providerName, settings, options);
      const timeoutMs = this.getTimeoutForProvider(providerName, settings, options);

      try {
        const response = await provider.generate(messages, systemPrompt, {
          ...options,
          model,
          maxTokens,
          timeoutMs,
        });

        this.markProviderOperational(providerName, true);

        // Safe server-side diagnostic log: no user prompts or api keys
        console.log(`[AIRouter] provider=${providerName} model=${response.model} status=SUCCESS latency=${response.latencyMs}ms fallbackUsed=${i > 0}`);

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

        response.text = sanitizeAIOutput(response.text);
        return response;
      } catch (err: unknown) {
        this.markProviderOperational(providerName, false);
        const attemptLatency = Date.now() - attemptStart;
        const category =
          err instanceof ProviderError
            ? err.category
            : `${providerName.toUpperCase()}_ERROR`;

        console.warn(`[AIRouter] provider=${providerName} model=${model} status=${category} latency=${attemptLatency}ms`);

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

    // Check Kill Switch
    if (!settings.enabled || settings.globalKillSwitch) {
      throw new Error('AI_DISABLED: The StudentAI Assistant is currently paused by administrators for scheduled maintenance.');
    }

    const chain = await this.getFallbackChain();
    let hasAttemptedAny = false;

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
      const maxTokens = this.getTokenLimitForProvider(providerName, settings, options);
      const timeoutMs = this.getTimeoutForProvider(providerName, settings, options);

      try {
        let response: AIResponse;
        if (typeof provider.generateStream === 'function') {
          response = await provider.generateStream(
            messages,
            systemPrompt,
            { ...options, model, maxTokens, timeoutMs },
            onChunk
          );
        } else {
          response = await provider.generate(messages, systemPrompt, {
            ...options,
            model,
            maxTokens,
            timeoutMs,
          });
          if (response.text) onChunk?.(response.text);
        }

        this.markProviderOperational(providerName, true);

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
        this.markProviderOperational(providerName, false);
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
