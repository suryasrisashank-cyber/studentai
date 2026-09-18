'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, StudentAIMode } from '@/lib/ai/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import {
  Sparkles,
  Bot,
  Trash2,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  HelpCircle,
  GraduationCap,
  FileText,
  Briefcase,
  Layers,
} from 'lucide-react';

const STORAGE_KEY = 'studentai:v1:ai_chat_history';

interface StoredMessage extends ChatMessageType {
  timestamp: string;
}

const MODES: { id: StudentAIMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'general', label: 'General', icon: Layers, description: 'All-around student study assistant' },
  { id: 'explain', label: 'Explain', icon: BookOpen, description: 'Deep, intuitive conceptual breakdowns' },
  { id: 'exam', label: 'Exam Prep', icon: GraduationCap, description: 'High-yield revision and memory tips' },
  { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Condense notes and long text' },
  { id: 'practice', label: 'Practice', icon: HelpCircle, description: 'Test yourself with interactive questions' },
  { id: 'career', label: 'Career', icon: Briefcase, description: 'Resume tips & interview preparation' },
];

interface StudentAIChatProps {
  greeting?: string;
  subtitle?: string;
}

export function StudentAIChat({ greeting, subtitle }: StudentAIChatProps) {
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<StudentAIMode>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch {
      // LocalStorage access error ignored
    }
  }, []);

  // Save chat history to LocalStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // LocalStorage access error ignored
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);

    const userMessage: StoredMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare history payload (most recent 6 messages before this one)
      const historyPayload: ChatMessageType[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          mode,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'StudentAI Assistant encountered an issue.');
      }

      const assistantMessage: StoredMessage = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Generation was cancelled by user
        return;
      }
      const msg = err instanceof Error ? err.message : 'Failed to connect. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear the current conversation?')) {
      setMessages([]);
      setErrorMessage(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[550px] max-w-5xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                StudentAI Assistant
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Educational AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Study Smarter &bull; Step-by-Step Explanations &bull; Exam Prep
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 shrink-0">
          Mode:
        </span>
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={m.description}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              {greeting || 'Ask. Learn. Understand.'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {subtitle ||
                'Your free educational assistant for conceptual clarity, exam revision, algorithm walkthroughs, and career preparation.'}
            </p>

            <SuggestedPrompts
              mode={mode}
              onSelectPrompt={(p) => {
                setInput(p);
                handleSendMessage(p);
              }}
            />
          </div>
        ) : (
          <>
            {messages.map((m, idx) => (
              <ChatMessage
                key={idx}
                message={m}
                timestamp={m.timestamp}
                isLatest={idx === messages.length - 1}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 mr-4 sm:mr-12 shadow-sm animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>StudentAI is thinking and composing an answer...</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
                    className="mt-1.5 text-[11px] font-bold text-rose-800 dark:text-rose-200 underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Box & Privacy Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={() => handleSendMessage()}
          isLoading={isLoading}
          onStop={handleStop}
        />

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Server-side AI Gateway &bull; History saved locally in your browser</span>
          </div>
          <span className="hidden sm:inline">Free Educational AI &bull; No Login Required</span>
        </div>
      </div>
    </div>
  );
}
