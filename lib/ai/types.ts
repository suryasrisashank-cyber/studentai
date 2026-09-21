export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type StudentAIMode =
  | 'general'
  | 'explain'
  | 'exam'
  | 'summarize'
  | 'practice'
  | 'career';

export interface AIRequest {
  message: string;
  history?: ChatMessage[];
  mode?: StudentAIMode;
  stream?: boolean;
}

export interface SourceCitation {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  retrievedAt: string;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  sources?: SourceCitation[];
  retrievalUsed?: boolean;
}

export interface GenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export type AIProviderName = 'google' | 'groq' | 'openrouter' | 'bytez' | 'atria' | 'claude';

export type AIProviderStatus =
  | 'CONFIGURED'
  | 'NOT_CONFIGURED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'OPERATIONAL'
  | 'FAILED';

export type AIErrorCode =
  | 'AI_DISABLED'
  | 'AI_AUTH_REQUIRED'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_RATE_LIMITED'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_MODEL_UNAVAILABLE'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_REQUEST'
  | 'AI_CONTEXT_TOO_LARGE'
  | 'AI_FILE_TOO_LARGE'
  | 'AI_INTERNAL_ERROR';

export interface AISiteSettings {
  enabled: boolean;
  globalKillSwitch?: boolean;
  primaryProvider: AIProviderName;
  secondaryProvider: AIProviderName;
  tertiaryProvider: AIProviderName;
  providerPriority?: AIProviderName[];
  googleModel: string;
  claudeModel?: string;
  groqModel: string;
  openrouterModel: string;
  bytezModel?: string;
  atriaModel?: string;
  retrievalEnabled: boolean;
  maxOutputTokens: number;
  providerTimeouts?: Partial<Record<AIProviderName, number>>;
  providerTokenLimits?: Partial<Record<AIProviderName, number>>;
  rateLimitPerMinute?: number;
  dailyQuotaPerIp?: number;
}

export interface AdminAITestResult {
  success: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  textSnippet: string;
  retrievalUsed: boolean;
  sourcesCount: number;
  error?: string;
  statusState?: AIProviderStatus;
}

export interface AIProvider {
  name: AIProviderName;
  isConfigured(): boolean;
  getStatus?(model?: string): { status: AIProviderStatus; message?: string };
  generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
  ): Promise<AIResponse>;
  generateStream?(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse>;
}

export class ProviderError extends Error {
  provider: string;
  category: string;
  statusCode?: number;

  constructor(provider: string, category: string, statusCode?: number) {
    super(`${provider.toUpperCase()}_${category}`);
    this.name = 'ProviderError';
    this.provider = provider;
    this.category = `${provider.toUpperCase()}_${category}`;
    this.statusCode = statusCode;
  }
}

export interface StandardAIErrorResponse {
  error: {
    code: AIErrorCode;
    message: string;
    status: number;
    details?: string;
  };
}
