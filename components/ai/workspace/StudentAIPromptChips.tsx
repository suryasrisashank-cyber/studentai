'use client';

import React from 'react';
import { GraduationCap, Users, Sparkles } from 'lucide-react';

interface StudentAIPromptChipsProps {
  onSelectPrompt: (prompt: string) => void;
}

const BTECH_PROMPTS = [
  'Explain operating systems with examples',
  'Give me a Python code for file handling',
  'What is the difference between DBMS and RDBMS?',
  'Explain blockchain in simple terms',
  'Top 10 cybersecurity interview questions',
];

const EDUCATOR_PROMPTS = [
  'Create a lesson plan for Machine Learning',
  'Generate quiz questions on DBMS',
  'Summarize this topic in simple language',
  'Give revision notes for exam',
  'Create assignment questions with solutions',
];

export function StudentAIPromptChips({ onSelectPrompt }: StudentAIPromptChipsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Left Column: Popular Prompts for B.Tech Students */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C132E]/80 border border-slate-800/80 shadow-md">
        <div className="flex items-center gap-2 mb-3 text-xs sm:text-sm font-bold text-white">
          <div className="w-6 h-6 rounded-lg bg-[#1B2550] flex items-center justify-center text-[#8B5CF6]">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span>Popular Prompts for B.Tech Students</span>
        </div>

        <div className="flex flex-col gap-2">
          {BTECH_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(promptText)}
              className="text-left px-3.5 py-2 rounded-xl text-xs bg-[#101738]/90 hover:bg-[#182352] text-slate-300 hover:text-white border border-slate-700/60 hover:border-[#6D5DFB]/40 transition-all flex items-center justify-between group"
            >
              <span className="truncate">{promptText}</span>
              <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-[#8B5CF6] shrink-0 ml-2 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Useful for Educators */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C132E]/80 border border-slate-800/80 shadow-md">
        <div className="flex items-center gap-2 mb-3 text-xs sm:text-sm font-bold text-white">
          <div className="w-6 h-6 rounded-lg bg-[#251B50] flex items-center justify-center text-[#A78BFA]">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span>Useful for Educators</span>
        </div>

        <div className="flex flex-col gap-2">
          {EDUCATOR_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(promptText)}
              className="text-left px-3.5 py-2 rounded-xl text-xs bg-[#101738]/90 hover:bg-[#182352] text-slate-300 hover:text-white border border-slate-700/60 hover:border-[#6D5DFB]/40 transition-all flex items-center justify-between group"
            >
              <span className="truncate">{promptText}</span>
              <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-[#A78BFA] shrink-0 ml-2 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
