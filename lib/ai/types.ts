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

export interface AISiteSettings {
  enabled: boolean;
  primaryProvider: 'google' | 'groq' | 'openrouter';
  secondaryProvider: 'google' | 'groq' | 'openrouter';
  tertiaryProvider: 'google' | 'groq' | 'openrouter';
  googleModel: string;
  groqModel: string;
  openrouterModel: string;
  retrievalEnabled: boolean;
  maxOutputTokens: number;
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
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
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
