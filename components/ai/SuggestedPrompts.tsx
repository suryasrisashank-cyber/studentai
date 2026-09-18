'use client';

import React from 'react';
import { StudentAIMode } from '@/lib/ai/types';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  mode: StudentAIMode;
  onSelectPrompt: (prompt: string) => void;
}

const PROMPT_SUGGESTIONS: Record<StudentAIMode, string[]> = {
  general: [
    'Explain machine learning simply',
    'Create a study plan for my exam',
    'Explain how binary search works',
    'Tips to avoid study burnout',
  ],
  explain: [
    'Explain recursion with a real-life analogy',
    'How does time complexity O(n log n) work?',
    'Explain photosynthesis step-by-step',
    'What is the difference between SQL and NoSQL?',
  ],
  exam: [
    'High-yield revision points for operating systems',
    'Top 5 memory mnemonics for biology exams',
    'How to tackle multiple choice exam questions',
    'Key formulas for standard calculus derivatives',
  ],
  summarize: [
    'Summarize this chapter into key takeaways',
    'Turn my lecture notes into revision bullet points',
    'Extract the core concepts from this text',
    'Create an executive summary for this assignment',
  ],
  practice: [
    'Quiz me on Python data structures with 3 questions',
    'Give me a tricky probability problem to solve',
    'Ask me a conceptual question about database normalization',
    'Give me a calculus problem to test my skills',
  ],
  career: [
    'How do I write impactful resume bullet points?',
    'Common behavioral interview questions and STAR method',
    'Technical questions asked in software engineer interviews',
    'How to explain a gap year or career pivot',
  ],
};

export function SuggestedPrompts({ mode, onSelectPrompt }: SuggestedPromptsProps) {
  const prompts = PROMPT_SUGGESTIONS[mode] || PROMPT_SUGGESTIONS.general;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Suggested Prompts</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-xs text-slate-700 dark:text-slate-300 transition-all leading-snug group flex items-start justify-between gap-2"
          >
            <span>{prompt}</span>
            <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-bold shrink-0">
              &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
