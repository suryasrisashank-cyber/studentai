import { ChatMessage as ChatMessageType, StudentAIMode, SourceCitation } from '@/lib/ai/types';
import React from 'react';

export interface ExtendedStoredMessage extends ChatMessageType {
  timestamp: string;
  sources?: SourceCitation[];
  provider?: string;
  model?: string;
  retrievalUsed?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: StudentAIMode;
  messages: ExtendedStoredMessage[];
}

export interface SubjectItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
  defaultPrompt: string;
}

export interface ActionCardItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  color: string;
}

export interface PromptChipItem {
  id: string;
  label: string;
  prompt: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: 'google' | 'groq' | 'openrouter' | 'bytez' | 'atria';
  badge?: string;
  description: string;
}
