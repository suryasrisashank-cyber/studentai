'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';
import { MAX_USER_INPUT_LENGTH } from '@/lib/ai/security';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  onStop,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit();
      }
    }
  };

  const charCount = input.length;
  const isOverLimit = charCount > MAX_USER_INPUT_LENGTH;

  return (
    <div className="w-full">
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-2.5 sm:p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask StudentAI anything (e.g. explain a concept, study plan, code, exam tips)..."
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 max-h-44 min-h-[44px] py-1.5 px-1 leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium ${
                isOverLimit
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {charCount} / {MAX_USER_INPUT_LENGTH} chars
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500">
              &bull; Press Enter to send, Shift+Enter for new line
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                title="Stop response"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!input.trim() || isOverLimit || disabled}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all"
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
