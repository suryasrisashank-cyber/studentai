'use client';

import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, SourceCitation } from '@/lib/ai/types';
import { Bot, User, Copy, Check, ExternalLink, Globe, Sparkles, RefreshCw, Edit3 } from 'lucide-react';

interface ExtendedChatMessage extends ChatMessageType {
  sources?: SourceCitation[];
  provider?: string;
  model?: string;
  retrievalUsed?: boolean;
}

interface ChatMessageProps {
  message: ExtendedChatMessage;
  timestamp?: string;
  isLatest?: boolean;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
}

export const ChatMessage = React.memo(function ChatMessage({ message, timestamp, onRetry, onEdit }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Structured content renderer supporting code blocks, tables, bold, bullets, numbered lists
  const renderFormattedContent = (content: string) => {
    // 1. Split code blocks ```...```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0]?.match(/^[a-zA-Z0-9_\-#+]+$/) ? lines[0] : '';
        const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 text-left">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="font-semibold text-slate-300">{lang || 'code'}</span>
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

      // 2. Format regular lines (lists, bold, tables)
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1.5 whitespace-pre-wrap leading-relaxed">
          {lines.map((line, lineIdx) => {
            if (!line.trim()) return <div key={lineIdx} className="h-1.5" />;

            // Table row detection (| col1 | col2 |)
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
              const cells = line.split('|').filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
              const isSeparator = cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
              if (isSeparator) return null;

              return (
                <div key={lineIdx} className="grid grid-flow-col auto-cols-fr gap-2 py-1 px-2 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
                  {cells.map((cell, cIdx) => (
                    <span key={cIdx} className="truncate">{cell.trim()}</span>
                  ))}
                </div>
              );
            }

            // Bullet points
            const isBullet = /^[\*\-•]\s+/.test(line.trim());
            const cleanLine = isBullet ? line.trim().replace(/^[\*\-•]\s+/, '') : line;

            // Simple bold replacement **text**
            const boldParts = cleanLine.split(/(\*\*.*?\*\*)/g);

            const renderedLine = (
              <p key={lineIdx} className={isBullet ? 'pl-4 relative before:content-["•"] before:absolute before:left-1 before:text-indigo-500' : ''}>
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

            return renderedLine;
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
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {isUser ? 'You' : 'StudentAI Assistant'}
            </span>

            {!isUser && message.retrievalUsed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Globe className="w-3 h-3" />
                Live Web Grounded
              </span>
            )}

            {!isUser && message.provider && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {message.provider} &bull; {message.model}
              </span>
            )}

            {timestamp && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {timestamp}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isUser && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(message.content)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit and resend"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {!isUser && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

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
        </div>

        {/* Content */}
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          {renderFormattedContent(message.content)}
        </div>

        {/* Transparent Verified Sources Cards */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Verified Sources Consulted ({message.sources.length}):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group text-left"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {src.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-indigo-500" />
                  </div>
                  {src.snippet && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {src.snippet}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[9px] text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{src.domain}</span>
                    <span>Verified Live</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

