'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatMessage, StudentAIMode } from '@/lib/ai/types';
import Tooltip from '@mui/material/Tooltip';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Trash2,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

interface FloatingMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  { label: 'Explain a topic', prompt: 'Explain the concept of ' },
  { label: 'Exam preparation', prompt: 'Give me high-yield revision points on ' },
  { label: 'Summarize notes', prompt: 'Please summarize the following study notes:\n' },
  { label: 'Practice questions', prompt: 'Give me 3 practice quiz questions with solutions on ' },
  { label: 'Solve a problem', prompt: 'Help me understand how to solve this step-by-step:\n' },
  { label: 'Career guidance', prompt: 'What skills should I build for an entry-level role in ' },
  { label: 'Programming help', prompt: 'Explain the time complexity and algorithm for ' },
  { label: 'Cybersecurity learning', prompt: 'Explain the fundamental security principles of ' },
];

export function FloatingAIChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Don't render floating trigger when user is already on the dedicated /ai full page or on /admin
  if (pathname === '/ai' || pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    const newMsg: FloatingMessage = { role: 'user', content: textToSend };
    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          mode: 'general',
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'StudentAI Assistant encountered an issue.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Unable to connect to assistant.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
          <Tooltip title="Ask StudentAI" placement="left" arrow>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300 min-h-[48px] min-w-[48px]"
              aria-label="Ask StudentAI assistant"
            >
              <div className="relative">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <span className="font-bold text-sm tracking-tight hidden sm:inline">Ask StudentAI</span>
            </button>
          </Tooltip>
        </div>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-[420px] max-h-[85vh] sm:h-[620px] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 sm:px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">StudentAI Assistant</h3>
                <p className="text-[11px] text-indigo-100/90 leading-tight">Your AI study companion</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip title="Open full screen" arrow>
                <Link
                  href="/ai"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                  aria-label="Open full screen AI page"
                >
                  <Maximize2 className="w-4 h-4" />
                </Link>
              </Tooltip>

              {messages.length > 0 && (
                <Tooltip title="Clear chat" arrow>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                    aria-label="Clear chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors ml-0.5"
                aria-label="Close assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            {messages.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">How can I help you today?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Ask any question, explore study concepts, or tap a quick action below:
                  </p>
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2 justify-center">
                  {QUICK_ACTIONS.map((qa, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setInput(qa.prompt);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 transition-all text-left"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>

                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(m.content, idx)}
                          className="hover:text-indigo-600 flex items-center gap-1"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>StudentAI is composing an answer...</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => handleSend(messages[messages.length - 1]?.content)}
                        className="mt-1 text-[11px] underline font-bold"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Box */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 min-h-[42px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                aria-label="Send question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
