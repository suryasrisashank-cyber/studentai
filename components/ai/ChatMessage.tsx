'use client';

import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/ai/types';
import { Bot, User, Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  timestamp?: string;
  isLatest?: boolean;
}

export function ChatMessage({ message, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard fails
    }
  };

  // Basic markdown-like parser for bold, bullet points, and code blocks
  const renderFormattedContent = (content: string) => {
    // Split by code blocks ```...```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span>{lang || 'code'}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white transition-colors"
                title="Copy code"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre">
              {code}
            </pre>
          </div>
        );
      }

      // Format lines with bullet points and bold
      return (
        <div key={index} className="space-y-1.5 whitespace-pre-wrap leading-relaxed">
          {part.split('\n').map((line, lineIdx) => {
            if (!line) return <div key={lineIdx} className="h-1.5" />;

            // Simple bold replacement **text**
            const boldParts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={lineIdx}>
                {boldParts.map((bp, bpIdx) => {
                  if (bp.startsWith('**') && bp.endsWith('**')) {
                    return (
                      <strong key={bpIdx} className="font-semibold text-slate-900 dark:text-white">
                        {bp.slice(2, -2)}
                      </strong>
                    );
                  }
                  return bp;
                })}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div
      className={`flex gap-3 sm:gap-4 p-4 rounded-2xl transition-colors ${
        isUser
          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 ml-4 sm:ml-12 border border-indigo-100 dark:border-indigo-900/50'
          : 'bg-white dark:bg-slate-900/70 mr-4 sm:mr-12 border border-slate-200 dark:border-slate-800 shadow-sm'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {isUser ? 'You' : 'StudentAI Assistant'}
            </span>
            {timestamp && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {timestamp}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy message"
            aria-label="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          {renderFormattedContent(message.content)}
        </div>
      </div>
    </div>
  );
}
