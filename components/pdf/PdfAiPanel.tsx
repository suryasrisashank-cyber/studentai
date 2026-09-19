'use client';

import React, { useState } from 'react';
import { Bot, Copy, Check, Download, Sparkles, AlertCircle } from 'lucide-react';
import { downloadUint8Array } from '@/lib/pdf/utils';

interface PdfAiPanelProps {
  toolSlug: string;
  extractedText: string;
  onRunAi: (action: string, options: { format?: string; targetLanguage?: string }) => Promise<string>;
}

export function PdfAiPanel({ toolSlug, extractedText, onRunAi }: PdfAiPanelProps) {
  const [activeTab, setActiveTab] = useState<'summarize' | 'study-notes' | 'exam-prep' | 'translate' | 'markdown'>(
    toolSlug === 'translate' ? 'translate' : toolSlug === 'pdf-to-markdown' ? 'markdown' : 'summarize'
  );
  const [targetLang, setTargetLang] = useState('Spanish');
  const [resultText, setResultText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let action = 'summarize';
      let format = 'concise';

      if (activeTab === 'study-notes') {
        action = 'summarize';
        format = 'detailed';
      } else if (activeTab === 'exam-prep') {
        action = 'summarize';
        format = 'exam-prep';
      } else if (activeTab === 'translate') {
        action = 'translate';
      } else if (activeTab === 'markdown') {
        action = 'markdown';
      }

      const res = await onRunAi(action, { format, targetLanguage: targetLang });
      setResultText(res);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(resultText);
    const ext = activeTab === 'markdown' ? 'md' : 'txt';
    downloadUint8Array(bytes, `studentai_${activeTab}_output.${ext}`, 'text/plain');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Action Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {toolSlug === 'summarize' && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('summarize')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'summarize'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('study-notes')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'study-notes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Study Notes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exam-prep')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'exam-prep'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Exam Questions
            </button>
          </>
        )}

        {toolSlug === 'translate' && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Translate to:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Japanese">Japanese (日本語)</option>
              <option value="Chinese">Chinese (中文)</option>
            </select>
          </div>
        )}

        {toolSlug === 'pdf-to-markdown' && (
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs">
            Convert Document to GitHub Markdown
          </span>
        )}
      </div>

      {/* Trigger Button */}
      {!resultText && !isLoading && (
        <div className="text-center py-4">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI Assistant</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 text-center space-y-3 animate-pulse">
          <Bot className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            StudentAI Assistant is analyzing your document text...
          </p>
          <p className="text-[11px] text-slate-400">Gated by Google → Groq → OpenRouter fallback chain</p>
        </div>
      )}

      {/* Result Display */}
      {resultText && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                {activeTab.replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
            {resultText}
          </div>
        </div>
      )}
    </div>
  );
}
