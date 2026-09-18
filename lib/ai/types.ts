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
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  generate(
    messages: ChatMessage[],
    systemPrompt: string,
    options?: GenerationOptions
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

