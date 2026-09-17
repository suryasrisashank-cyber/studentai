'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { Copy, Check, Type, Clock, AlignLeft, Sparkles, BookOpen } from 'lucide-react';

export function WordCounter() {
  const tool = getToolBySlug('word-counter')!;

  const [text, setText] = useState<string>(
    'StudentAI is designed to provide practical, accessible digital tools for students worldwide. All calculations and text processing run 100% client-side inside your browser with zero server uploads and zero subscription fees.'
  );
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const raw = text;
    const trimmed = raw.trim();

    // Words count
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

    // Characters count
    const characters = raw.length;
    const charactersNoSpaces = raw.replace(/\s/g, '').length;

    // Sentences count (split on . ! ?)
    const sentences = trimmed
      ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;

    // Paragraphs count
    const paragraphs = trimmed
      ? trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length
      : 0;

    // Reading time: avg 200 words per minute
    const readingTimeMinutes = Math.ceil(words / 200);

    // Speaking time: avg 130 words per minute
    const speakingTimeMinutes = Math.ceil(words / 130);

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTime: `${readingTimeMinutes} min${readingTimeMinutes === 1 ? '' : 's'}`,
      speakingTime: `${speakingTimeMinutes} min${speakingTimeMinutes === 1 ? '' : 's'}`,
    };
  }, [text]);

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setText('');
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Paste or type any essay, assignment, or thesis draft into the input area.',
          'Statistics update in real time without sending keystrokes to any server.',
          'Reading time assumes a standard adult comprehension rate of 200 words per minute.',
          'Speaking time uses the standard presentation speech pace of 130 words per minute.',
        ],
        faqs: [
          {
            q: 'Is there any limit to the text length?',
            a: 'No artificial limit is imposed. The browser processes millions of characters smoothly in memory.',
          },
        ],
      }}
    >
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Words
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.words.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Characters
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.characters.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chars (No Spaces)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.charactersNoSpaces.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sentences
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.sentences.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Paragraphs
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.paragraphs.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Reading Time
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.readingTime}
            </div>
          </div>
        </div>

        {/* Main Textarea */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-indigo-600" />
              <span>Enter Or Paste Text</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="w-full min-h-[320px] p-4 text-sm sm:text-base rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Est. speech delivery: {stats.speakingTime}</span>
            </span>
            <span>Real-time local processing</span>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
