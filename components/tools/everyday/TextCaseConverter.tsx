'use client';

import React, { useState } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { Copy, Check, CaseSensitive, Sparkles } from 'lucide-react';

export function TextCaseConverter() {
  const tool = getToolBySlug('text-case-converter')!;

  const [input, setInput] = useState<string>(
    'Master Operating Systems and Computer Architecture with StudentAI'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Conversion functions
  const toUpperCase = (str: string) => str.toUpperCase();
  const toLowerCase = (str: string) => str.toLowerCase();

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
      .join(' ');
  };

  const toSentenceCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  };

  const toCamelCase = (str: string) => {
    const words = str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
    if (words.length === 0) return '';
    return (
      words[0].toLowerCase() +
      words
        .slice(1)
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join('')
    );
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  };

  const toSnakeCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.toLowerCase())
      .join('_');
  };

  const toKebabCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.toLowerCase())
      .join('-');
  };

  const toConstantCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.toUpperCase())
      .join('_');
  };

  const conversions = [
    { key: 'upper', label: 'UPPERCASE', value: toUpperCase(input) },
    { key: 'lower', label: 'lowercase', value: toLowerCase(input) },
    { key: 'title', label: 'Title Case', value: toTitleCase(input) },
    { key: 'sentence', label: 'Sentence case', value: toSentenceCase(input) },
    { key: 'camel', label: 'camelCase', value: toCamelCase(input) },
    { key: 'pascal', label: 'PascalCase', value: toPascalCase(input) },
    { key: 'snake', label: 'snake_case', value: toSnakeCase(input) },
    { key: 'kebab', label: 'kebab-case', value: toKebabCase(input) },
    { key: 'constant', label: 'CONSTANT_CASE', value: toConstantCase(input) },
  ];

  const handleCopy = async (key: string, text: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleReset = () => {
    setInput('');
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Type or paste text into the source input box.',
          'The application dynamically transforms your text into multiple naming and typography conventions simultaneously.',
          'Click the copy icon on any converted result to copy it to your clipboard.',
        ],
        faqs: [
          {
            q: 'When should I use camelCase vs snake_case?',
            a: 'camelCase is typical for JavaScript/TypeScript variables, snake_case is standard in Python, and kebab-case is standard for URLs and CSS class names.',
          },
        ],
      }}
    >
      <div className="space-y-6">
        {/* Source Text Input */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CaseSensitive className="w-4 h-4 text-indigo-600" />
            <span>Enter Text To Convert</span>
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Type or paste any text to see instant case conversions..."
            className="w-full p-3.5 text-sm sm:text-base rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Conversion Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conversions.map((conv) => (
            <div
              key={conv.key}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {conv.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(conv.key, conv.value)}
                    disabled={!conv.value}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                    title={`Copy ${conv.label}`}
                    aria-label={`Copy ${conv.label}`}
                  >
                    {copiedKey === conv.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100 break-words line-clamp-3">
                  {conv.value || <span className="text-slate-400 font-sans text-xs">Waiting for input...</span>}
                </p>
              </div>

              {copiedKey === conv.key && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                  Copied to clipboard!
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
