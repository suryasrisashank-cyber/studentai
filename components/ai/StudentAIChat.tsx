'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, StudentAIMode, SourceCitation } from '@/lib/ai/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import {
  Sparkles,
  Bot,
  Trash2,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  HelpCircle,
  GraduationCap,
  FileText,
  Briefcase,
  Layers,
  Square,
  Globe,
  PlusCircle,
} from 'lucide-react';

const STORAGE_KEY = 'studentai:v2:ai_chat_history';

interface ExtendedStoredMessage extends ChatMessageType {
  timestamp: string;
  sources?: SourceCitation[];
  provider?: string;
  model?: string;
  retrievalUsed?: boolean;
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
  const [messages, setMessages] = useState<ExtendedStoredMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<StudentAIMode>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [streamingSources, setStreamingSources] = useState<SourceCitation[]>([]);
  const [streamingRetrieval, setStreamingRetrieval] = useState<boolean>(false);

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
    } catch {}
  }, []);

  // Save chat history to LocalStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingMessage]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);

    // Commit whatever has been streamed so far as assistant response
    if (streamingMessage) {
      const partialMessage: ExtendedStoredMessage = {
        role: 'assistant',
        content: streamingMessage + ' [Stopped]',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: streamingSources,
        retrievalUsed: streamingRetrieval,
      };
      setMessages((prev) => [...prev, partialMessage]);
      setStreamingMessage('');
      setStreamingSources([]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);

    const userMessage: ExtendedStoredMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');
    setStreamingSources([]);
    setStreamingRetrieval(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
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
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || 'StudentAI Assistant encountered an issue.');
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Unable to establish stream reader.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let activeSources: SourceCitation[] = [];
      let activeRetrieval = false;
      let finalProvider = '';
      let finalModel = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.type === 'metadata') {
              if (parsed.sources) {
                activeSources = parsed.sources;
                setStreamingSources(parsed.sources);
              }
              if (parsed.retrievalUsed) {
                activeRetrieval = true;
                setStreamingRetrieval(true);
              }
            } else if (parsed.type === 'chunk') {
              accumulatedText += parsed.text;
              setStreamingMessage(accumulatedText);
            } else if (parsed.type === 'done') {
              finalProvider = parsed.provider;
              finalModel = parsed.model;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (e: any) {
            if (e?.message && e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }

      const assistantMessage: ExtendedStoredMessage = {
        role: 'assistant',
        content: accumulatedText || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: activeSources,
        retrievalUsed: activeRetrieval,
        provider: finalProvider,
        model: finalModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessage('');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Failed to connect. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your conversation?')) {
      setMessages([]);
      setErrorMessage(null);
      setStreamingMessage('');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleEditMessage = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {greeting || 'StudentAI Study Assistant'}
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {subtitle || 'Grounded multi-provider reasoning with live web retrieval'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setStreamingMessage('');
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="New Conversation"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear Conversation"
              aria-label="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Operating Mode Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Mode:</span>
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8 space-y-6 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                How can I help you study today?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                Ask any question, request step-by-step solutions, debug code, or inquire about current 2026 notifications.
              </p>
            </div>

            <div className="w-full pt-2">
              <SuggestedPrompts mode={mode} onSelectPrompt={(p) => handleSendMessage(p)} />
            </div>


            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Private & Client-Secured &bull; Transparent Real-Time Citations</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg}
                timestamp={msg.timestamp}
                isLatest={index === messages.length - 1}
                onRetry={msg.role === 'assistant' ? handleRetryLast : undefined}
                onEdit={msg.role === 'user' ? () => handleEditMessage(msg.content) : undefined}
              />
            ))}

            {/* Live Streaming Message Display */}
            {isStreaming && (
              <div className="flex gap-3 sm:gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/70 mr-4 sm:mr-12 border border-indigo-200 dark:border-indigo-900/80 shadow-sm animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      StudentAI Assistant
                    </span>
                    {streamingRetrieval && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse">
                        <Globe className="w-3 h-3" />
                        Grounded Search Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {streamingMessage || (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        Analyzing query & consulting verified sources...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleRetryLast}
              className="text-xs font-bold underline hover:no-underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0">
        <div className="relative">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={() => handleSendMessage()}
            isLoading={isLoading}
            onStop={handleStopGeneration}
            placeholder={`Ask a ${mode} question or inquiry...`}
          />


          {isStreaming && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={handleStopGeneration}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-200 transition-colors"
                title="Stop generation"
              >
                <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
