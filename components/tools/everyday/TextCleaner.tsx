'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { Sparkles, Copy, Check, Trash2, ArrowUpDown, Filter } from 'lucide-react';

export function TextCleaner() {
  const tool = getToolBySlug('text-cleaner')!;

  const [rawText, setRawText] = useState<string>(
    `  Operating   Systems     Concepts  \n\n\n  Database  Management   \n  Computer Networks  \n  Database  Management   \n  Operating   Systems     Concepts  \n`
  );

  // Options
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState(true);
  const [removeDuplicateBlankLines, setRemoveDuplicateBlankLines] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [removeDuplicateLines, setRemoveDuplicateLines] = useState(true);
  const [sortLines, setSortLines] = useState<'none' | 'asc' | 'desc'>('none');
  const [joinIntoSingleLine, setJoinIntoSingleLine] = useState(false);

  const [copied, setCopied] = useState(false);

  const cleanedText = useMemo(() => {
    let result = rawText;

    // Split lines
    let lines = result.split('\n');

    if (trimLines) {
      lines = lines.map((l) => l.trim());
    }

    if (removeExtraSpaces) {
      lines = lines.map((l) => l.replace(/[ \t]+/g, ' '));
    }

    if (removeDuplicateBlankLines) {
      const filtered: string[] = [];
      let prevWasBlank = false;
      for (const line of lines) {
        const isBlank = line.trim().length === 0;
        if (isBlank && prevWasBlank) continue;
        filtered.push(line);
        prevWasBlank = isBlank;
      }
      lines = filtered;
    }

    if (removeDuplicateLines) {
      const seen = new Set<string>();
      lines = lines.filter((line) => {
        if (line.trim().length === 0) return true; // keep blank lines if permitted
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      });
    }

    if (sortLines === 'asc') {
      lines.sort((a, b) => a.localeCompare(b));
    } else if (sortLines === 'desc') {
      lines.sort((a, b) => b.localeCompare(a));
    }

    if (joinIntoSingleLine) {
      return lines.filter((l) => l.trim().length > 0).join(' ');
    }

    return lines.join('\n');
  }, [
    rawText,
    removeExtraSpaces,
    removeDuplicateBlankLines,
    trimLines,
    removeDuplicateLines,
    sortLines,
    joinIntoSingleLine,
  ]);

  const stats = useMemo(() => {
    const origChars = rawText.length;
    const cleanChars = cleanedText.length;
    const origLines = rawText.split('\n').length;
    const cleanLines = cleanedText.split('\n').length;

    return {
      charsSaved: Math.max(0, origChars - cleanChars),
      linesRemoved: Math.max(0, origLines - cleanLines),
    };
  }, [rawText, cleanedText]);

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(cleanedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setRawText('');
    setSortLines('none');
    setJoinIntoSingleLine(false);
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Paste unformatted, scraped, or messy copied text into the raw text box.',
          'Toggle cleaning options such as removing duplicate spaces, trimming whitespace, and deduplicating lines.',
          'Sort lines alphabetically or join fragmented lines with one click.',
        ],
        faqs: [
          {
            q: 'Does text cleaning preserve emojis or special characters?',
            a: 'Yes, unicode characters, accents, and symbols are fully preserved.',
          },
        ],
      }}
    >
      <div className="space-y-6">
        {/* Cleaning Options Toggles */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Cleaning & Formatting Controls</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={removeExtraSpaces}
                onChange={(e) => setRemoveExtraSpaces(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Remove Extra Spaces
              </span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={removeDuplicateBlankLines}
                onChange={(e) => setRemoveDuplicateBlankLines(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Remove Duplicate Blank Lines
              </span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={trimLines}
                onChange={(e) => setTrimLines(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Trim Line Edges
              </span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={removeDuplicateLines}
                onChange={(e) => setRemoveDuplicateLines(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Remove Duplicate Lines
              </span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={joinIntoSingleLine}
                onChange={(e) => setJoinIntoSingleLine(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Join All Into One Line
              </span>
            </label>

            <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-slate-600 dark:text-slate-400 text-xs pl-1">Sort:</span>
              <select
                value={sortLines}
                onChange={(e) => setSortLines(e.target.value as 'none' | 'asc' | 'desc')}
                className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="none">No Sorting</option>
                <option value="asc">A &rarr; Z Alphabetical</option>
                <option value="desc">Z &rarr; A Reverse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Side-by-side or stacked text areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Raw Text Input */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Original Text
              </label>
              <span className="text-xs text-slate-500">
                {rawText.length} chars &bull; {rawText.split('\n').length} lines
              </span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              placeholder="Paste raw unformatted text..."
              className="w-full p-3.5 text-xs sm:text-sm font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Cleaned Text Output */}
          <div className="rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/50 p-5 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Cleaned Output
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!cleanedText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Cleaned'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={cleanedText}
                rows={12}
                placeholder="Cleaned text will appear here automatically..."
                className="w-full p-3.5 text-xs sm:text-sm font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{cleanedText.length} chars remaining</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Saved {stats.charsSaved} chars ({stats.linesRemoved} lines removed)
              </span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
