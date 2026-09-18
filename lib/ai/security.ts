import { AIRequest, ChatMessage, StudentAIMode } from './types';

export const MAX_USER_INPUT_LENGTH = 3000;
export const MAX_HISTORY_MESSAGES = 8;
export const MAX_HISTORY_ITEM_LENGTH = 2000;

export const ALLOWED_MODES: StudentAIMode[] = [
  'general',
  'explain',
  'exam',
  'summarize',
  'practice',
  'career',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedRequest?: AIRequest;
}

/**
 * Validates and sanitizes incoming user AI chat requests.
 * Only 'user' and 'assistant' roles are permitted from the client.
 */
export function validateAIRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const raw = body as Record<string, unknown>;

  // Validate message
  if (typeof raw.message !== 'string') {
    return { valid: false, error: 'Message field is required and must be a string.' };
  }

  const trimmedMessage = raw.message.trim();
  if (trimmedMessage.length === 0) {
    return { valid: false, error: 'Please enter a valid question or topic.' };
  }

  if (trimmedMessage.length > MAX_USER_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Your question exceeds the maximum limit of ${MAX_USER_INPUT_LENGTH} characters. Please shorten it.`,
    };
  }

  // Validate mode
  let validatedMode: StudentAIMode = 'general';
  if (raw.mode !== undefined) {
    if (typeof raw.mode !== 'string' || !ALLOWED_MODES.includes(raw.mode as StudentAIMode)) {
      return { valid: false, error: 'Invalid mode specified.' };
    }
    validatedMode = raw.mode as StudentAIMode;
  }

  // Validate history
  const validatedHistory: ChatMessage[] = [];
  if (raw.history !== undefined) {
    if (!Array.isArray(raw.history)) {
      return { valid: false, error: 'History must be an array of messages.' };
    }

    // Limit history count to most recent entries
    const recentHistory = raw.history.slice(-MAX_HISTORY_MESSAGES);

    for (const item of recentHistory) {
      if (!item || typeof item !== 'object') {
        return { valid: false, error: 'Invalid message in history array.' };
      }

      const role = item.role;
      const content = item.content;

      // Only allow 'user' and 'assistant' roles. Reject system, developer, tool, etc.
      if (role !== 'user' && role !== 'assistant') {
        return {
          valid: false,
          error: 'Invalid message role in history. Only "user" and "assistant" roles are allowed.',
        };
      }

      if (typeof content !== 'string') {
        return { valid: false, error: 'Message content in history must be a string.' };
      }

      // Truncate each history item if excessively long to protect token budget
      const cleanContent = content.slice(0, MAX_HISTORY_ITEM_LENGTH);
      validatedHistory.push({
        role,
        content: cleanContent,
      });
    }
  }

  return {
    valid: true,
    sanitizedRequest: {
      message: trimmedMessage,
      history: validatedHistory,
      mode: validatedMode,
    },
  };
}

/**
 * Redacts any potential API keys or sensitive credential patterns from outgoing AI responses.
 */
export function sanitizeAIOutput(text: string): string {
  if (!text) return '';

  // Redact potential API key formats (Google, Groq, OpenRouter, generic hex/base64 tokens)
  return text
    .replace(/gsk_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/sk-or-v1-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/AQ\.[a-zA-Z0-9_-]{30,}/g, '[REDACTED_API_KEY]');
}
