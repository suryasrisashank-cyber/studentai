'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  CheckCheck,
  RefreshCw,
  Lightbulb,
  ExternalLink,
  Globe,
  HelpCircle,
  Bookmark,
  MoreHorizontal,
  Wand2,
} from 'lucide-react';
import { ExtendedStoredMessage } from './types';

interface StudentAIChatMessageProps {
  message: ExtendedStoredMessage;
  timestamp?: string;
  isLatest?: boolean;
  onRetry?: () => void;
  onExplainSimpler?: (context: string) => void;
  onQuizMe?: (context: string) => void;
}

export const StudentAIChatMessage = React.memo(function StudentAIChatMessage({
  message,
  timestamp,
  isLatest,
  onRetry,
  onExplainSimpler,
  onQuizMe,
}: StudentAIChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Structured content parser: renders Markdown, code blocks, tables, lists, and takeaway callouts
  const renderFormattedContent = (content: string) => {
    // Split on code blocks ```...```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, partIdx) => {
      // 1. Code Block
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0]?.match(/^[a-zA-Z0-9_\-#+]+$/) ? lines[0] : '';
        const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div
            key={partIdx}
            className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-[#070B1E] text-left shadow-md"
          >
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0C132E] border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="font-semibold text-slate-300 uppercase">{lang || 'CODE'}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white transition-colors"
                title="Copy code"
              >
                Copy
              </button>
            </div>
            <pre className="p-3.5 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
              {code}
            </pre>
          </div>
        );
      }

      // 2. Normal text parsing for tables, key takeaways, headers, and bullet points
      const lines = part.split('\n');
      const elements: React.ReactNode[] = [];
      let inTable = false;
      let tableRows: string[][] = [];

      const flushTable = (key: number) => {
        if (tableRows.length === 0) return null;
        const [headerRow, ...bodyRows] = tableRows;
        return (
          <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-xl border border-slate-700/80 bg-[#090E26]">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-[#10183E] border-b border-slate-700/80 text-white font-semibold">
                  {headerRow.map((h, i) => (
                    <th key={i} className="py-2 px-3 text-[11px] font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-slate-800/60 hover:bg-[#121A40]/40 transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-xs">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Table detection
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          const cells = trimmed
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          const isSeparator = cells.every((c) => /^\s*:?-+:?\s*$/.test(c));

          if (!isSeparator) {
            inTable = true;
            tableRows.push(cells);
          }
          continue;
        } else if (inTable) {
          elements.push(flushTable(i));
          tableRows = [];
          inTable = false;
        }

        if (!trimmed) {
          elements.push(<div key={`space-${i}`} className="h-2" />);
          continue;
        }

        // Key Takeaway Callout Box Detection
        if (
          trimmed.toLowerCase().startsWith('key takeaway') ||
          trimmed.toLowerCase().startsWith('💡 key takeaway') ||
          trimmed.toLowerCase().startsWith('takeaway:')
        ) {
          const cleanHeading = 'Key takeaway';
          const contentAfter = trimmed.replace(/^(💡\s*)?(key takeaway:?|takeaway:?)/i, '').trim();

          elements.push(
            <div
              key={`takeaway-${i}`}
              className="my-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-amber-300 text-xs">{cleanHeading}</div>
                <div className="text-slate-200 text-xs leading-relaxed mt-0.5">
                  {contentAfter || lines[i + 1] || 'Core conceptual insight.'}
                </div>
              </div>
            </div>
          );
          continue;
        }

        // Heading 1-3 detection
        if (trimmed.startsWith('#')) {
          const level = trimmed.match(/^#+/)?.[0].length || 1;
          const headingText = trimmed.replace(/^#+\s*/, '');
          if (level <= 2) {
            elements.push(
              <h4 key={`h-${i}`} className="text-sm sm:text-base font-bold text-white tracking-tight mt-3 mb-1">
                {headingText}
              </h4>
            );
          } else {
            elements.push(
              <h5 key={`h-${i}`} className="text-xs sm:text-sm font-semibold text-slate-200 mt-2 mb-1">
                {headingText}
              </h5>
            );
          }
          continue;
        }

        // Bullet points
        const isBullet = /^[\*\-•]\s+/.test(trimmed);
        // Numbered list
        const isNumbered = /^\d+[\.\)]\s+/.test(trimmed);

        const cleanLine = trimmed
          .replace(/^[\*\-•]\s+/, '')
          .replace(/^\d+[\.\)]\s+/, '');

        // Bold formatting **text**
        const boldParts = cleanLine.split(/(\*\*.*?\*\*)/g);

        elements.push(
          <div
            key={`line-${i}`}
            className={`leading-relaxed text-xs sm:text-sm ${
              isBullet
                ? 'pl-4 relative before:content-["•"] before:absolute before:left-1 before:text-[#8B5CF6]'
                : isNumbered
                ? 'pl-5 relative'
                : ''
            }`}
          >
            {isNumbered && (
              <span className="absolute left-0 text-slate-400 font-semibold text-xs">
                {trimmed.match(/^\d+[\.\)]/)?.[0]}
              </span>
            )}
            {boldParts.map((bp, bpIdx) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return (
                  <strong key={bpIdx} className="font-semibold text-white">
                    {bp.slice(2, -2)}
                  </strong>
                );
              }
              return bp;
            })}
          </div>
        );
      }

      if (inTable) {
        elements.push(flushTable(lines.length));
      }

      return <div key={partIdx}>{elements}</div>;
    });
  };

  // 1. User Message (Right-aligned purple-blue gradient bubble)
  if (isUser) {
    return (
      <div className="flex justify-end w-full my-3">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs p-3.5 sm:p-4 bg-gradient-to-r from-[#6D5DFB] via-[#7B61FF] to-[#3B82F6] text-white shadow-lg shadow-[#6D5DFB]/20 text-xs sm:text-sm leading-relaxed">
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-white/80">
            <span>{timestamp || 'Just now'}</span>
            <CheckCheck className="w-3.5 h-3.5 text-white/90" />
          </div>
        </div>
      </div>
    );
  }

  // 2. AI Assistant Message (Spacious dark glass card with structured breakdown)
  return (
    <div className="w-full my-4 rounded-2xl bg-[#0C132E]/90 border border-slate-800/90 shadow-xl p-4 sm:p-5 text-left relative overflow-hidden">
      {/* Header Row: Avatar + Title + Model Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                StudentAI Assistant
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#18234E] text-[#A5B4FC] border border-[#6D5DFB]/30">
                StudentAI Pro
              </span>
            </div>
            {message.provider && (
              <span className="text-[10px] text-slate-400 font-mono">
                {message.provider} &bull; {message.model}
              </span>
            )}
          </div>
        </div>

        {timestamp && (
          <span className="text-[10px] text-slate-400">
            {timestamp}
          </span>
        )}
      </div>

      {/* Main Formatted Content */}
      <div className="text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2">
        {renderFormattedContent(message.content)}
      </div>

      {/* Verified Web Citations (if present) */}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
            <Globe className="w-3 h-3 text-[#38BDF8]" />
            <span>Verified Sources Consulted ({message.sources.length}):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-slate-800 bg-[#090E24] hover:border-[#6D5DFB]/60 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-[#A5B4FC]">
                    {src.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-[#38BDF8]" />
                </div>
                {src.snippet && (
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                    {src.snippet}
                  </p>
                )}
                <div className="text-[9px] text-[#38BDF8] mt-1 font-mono">
                  {src.domain}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Action Bar at Bottom */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Regenerate answer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[11px]">Regenerate</span>
            </button>
          )}

          {onExplainSimpler && (
            <button
              type="button"
              onClick={() => onExplainSimpler(message.content)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors"
              title="Explain simpler"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Explain simpler</span>
            </button>
          )}

          {onQuizMe && (
            <button
              type="button"
              onClick={() => onQuizMe(message.content)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-[#38BDF8] hover:bg-[#38BDF8]/10 transition-colors"
              title="Quiz me on this"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="text-[11px]">Quiz me</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Save note"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
