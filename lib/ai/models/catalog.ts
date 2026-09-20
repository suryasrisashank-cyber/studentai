/**
 * StudentAI AI Model Catalog & Verification
 * 
 * Verified active model catalog for Google, Groq, OpenRouter, Bytez, and Atria.
 * Supports dynamic configuration, admin custom models, and validation checks.
 */

import { AIProviderName } from '../types';

export interface ModelMetadata {
  id: string;
  name: string;
  provider: AIProviderName;
  contextWindow: number;
  description: string;
  isDefault?: boolean;
}

export const SUPPORTED_MODELS: Record<AIProviderName, ModelMetadata[]> = {
  google: [
    {
      id: 'gemini-3.6-flash',
      name: 'Gemini 3.6 Flash',
      provider: 'google',
      contextWindow: 1048576,
      description: 'Ultra-fast, high-efficiency multimodal model for everyday writing, reasoning, and study.',
      isDefault: true,
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest',
      provider: 'google',
      contextWindow: 1048576,
      description: 'Always points to the latest optimized production Gemini Flash release.',
    },
    {
      id: 'gemini-3.5-flash',
      name: 'Gemini 3.5 Flash',
      provider: 'google',
      contextWindow: 1048576,
      description: 'Stable high-throughput multimodal flash model.',
    },
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      provider: 'google',
      contextWindow: 1048576,
      description: 'Advanced reasoning model for complex STEM problem solving and software engineering.',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      contextWindow: 2097152,
      description: 'Flagship model for deep academic analysis, multi-document synthesis, and research.',
    },
  ],
  groq: [
    {
      id: 'openai/gpt-oss-120b',
      name: 'GPT-OSS 120B (Groq LPU)',
      provider: 'groq',
      contextWindow: 131072,
      description: 'High-throughput 120B open-weights model accelerated on Groq LPU hardware.',
      isDefault: true,
    },
    {
      id: 'qwen/qwen3.6-27b',
      name: 'Qwen 3.6 27B',
      provider: 'groq',
      contextWindow: 131072,
      description: 'High-accuracy multilingual reasoning and coding model running at ultra-low latency.',
    },
    {
      id: 'meta-llama/llama-guard-3-8b',
      name: 'Llama Guard 3 8B',
      provider: 'groq',
      contextWindow: 8192,
      description: 'Lightweight safety classifier and validation model.',
    },
  ],
  openrouter: [
    {
      id: 'openrouter/free',
      name: 'OpenRouter Free Auto-Router',
      provider: 'openrouter',
      contextWindow: 65536,
      description: 'Dynamic auto-router that dispatches requests across active free tier models.',
      isDefault: true,
    },
    {
      id: 'nvidia/nemotron-3-ultra:free',
      name: 'NVIDIA Nemotron 3 Ultra (Free)',
      provider: 'openrouter',
      contextWindow: 131072,
      description: 'Advanced reasoning and complex task planning model hosted on free tier.',
    },
    {
      id: 'google/gemma-4-31b-it:free',
      name: 'Google Gemma 4 31B (Free)',
      provider: 'openrouter',
      contextWindow: 32768,
      description: 'Efficient open-weights instruction model from Google on OpenRouter.',
    },
  ],
  bytez: [
    {
      id: 'meta-llama/Meta-Llama-3-8B-Instruct',
      name: 'Meta Llama 3 8B Instruct (Bytez)',
      provider: 'bytez',
      contextWindow: 8192,
      description: 'Fast, balanced open weights LLM served via Bytez API.',
      isDefault: true,
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.3',
      name: 'Mistral 7B Instruct v0.3 (Bytez)',
      provider: 'bytez',
      contextWindow: 32768,
      description: 'High-efficiency French and multilingual reasoning model hosted on Bytez.',
    },
    {
      id: 'Qwen/Qwen2.5-7B-Instruct',
      name: 'Qwen 2.5 7B Instruct (Bytez)',
      provider: 'bytez',
      contextWindow: 32768,
      description: 'Leading competitive open-source code and math model on Bytez.',
    },
  ],
  atria: [
    {
      id: 'Atria-Dawn-Preview',
      name: 'Atria Dawn Preview',
      provider: 'atria',
      contextWindow: 32768,
      description: 'Agentic reasoning and structured task decomposition model by Atria / Shanghai AI Lab.',
      isDefault: true,
    },
    {
      id: 'Atria-Dawn-Agent',
      name: 'Atria Dawn Agent',
      provider: 'atria',
      contextWindow: 32768,
      description: 'Tool-use and planning optimized agent model by Atria.',
    },
  ],
};

export const DEFAULT_MODELS: Record<AIProviderName, string> = {
  google: 'gemini-3.6-flash',
  groq: 'openai/gpt-oss-120b',
  openrouter: 'openrouter/free',
  bytez: 'meta-llama/Meta-Llama-3-8B-Instruct',
  atria: 'Atria-Dawn-Preview',
};

/**
 * Validates whether a given model identifier is recognized or syntactically valid for the provider.
 */
export function validateModelId(provider: AIProviderName, modelId: string): {
  valid: boolean;
  isKnownCatalogModel: boolean;
  sanitizedId: string;
} {
  const trimmed = (modelId || '').trim();
  if (!trimmed) {
    return { valid: false, isKnownCatalogModel: false, sanitizedId: '' };
  }

  const catalog = SUPPORTED_MODELS[provider] || [];
  const matched = catalog.find((m) => m.id.toLowerCase() === trimmed.toLowerCase());

  if (matched) {
    return { valid: true, isKnownCatalogModel: true, sanitizedId: matched.id };
  }

  // Allow custom model IDs if they meet basic provider formatting rules and do not contain path traversal
  const hasTraversal = trimmed.includes('..') || trimmed.startsWith('/') || trimmed.startsWith('.');
  const isValidFormat = !hasTraversal && /^[a-zA-Z0-9][a-zA-Z0-9_\-\.\:\/]*[a-zA-Z0-9]$/.test(trimmed) && trimmed.length >= 3;
  return { valid: isValidFormat, isKnownCatalogModel: false, sanitizedId: trimmed };
}
