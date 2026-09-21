'use client';

import React from 'react';
import {
  Lightbulb,
  Code2,
  FileText,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface StudentAIActionCardsProps {
  onSelectCard: (prompt: string) => void;
}

const ACTION_CARDS = [
  {
    id: 'explain',
    icon: Lightbulb,
    title: 'Explain a concept',
    description: 'Get simple, clear explanations for any topic.',
    prompt: 'Explain the concept of process scheduling in operating systems with real-world analogies and clear diagrams.',
    iconColor: 'text-[#38BDF8]',
    iconBg: 'bg-[#0E2442] border border-[#38BDF8]/30',
  },
  {
    id: 'solve',
    icon: Code2,
    title: 'Solve a problem',
    description: 'Step-by-step solutions with examples.',
    prompt: 'Help me solve this problem step-by-step with algorithm analysis, complexity explanation, and clean code: ',
    iconColor: 'text-[#60A5FA]',
    iconBg: 'bg-[#12224A] border border-[#60A5FA]/30',
  },
  {
    id: 'exam',
    icon: FileText,
    title: 'Exam preparation',
    description: 'Practice questions, key points and revision notes.',
    prompt: 'Generate an exam revision sheet with high-yield key concepts, 2-mark definitions, and 10-mark questions for: ',
    iconColor: 'text-[#A78BFA]',
    iconBg: 'bg-[#231A4A] border border-[#A78BFA]/30',
  },
  {
    id: 'lesson',
    icon: BookOpen,
    title: 'Create a lesson',
    description: 'Generate notes, slides or lesson plans.',
    prompt: 'Create a structured teaching lesson plan with learning outcomes, core lecture notes, and classroom activities on: ',
    iconColor: 'text-[#C084FC]',
    iconBg: 'bg-[#281745] border border-[#C084FC]/30',
  },
];

export function StudentAIActionCards({ onSelectCard }: StudentAIActionCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {ACTION_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectCard(card.prompt)}
            className="p-4 rounded-2xl bg-[#0C132E]/90 hover:bg-[#121B42] border border-slate-800/90 hover:border-[#6D5DFB]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6D5DFB]/10 text-left flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top Row: Icon + Arrow */}
            <div className="flex items-center justify-between w-full mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} shadow-xs group-hover:scale-105 transition-transform`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Bottom Info */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-[#A5B4FC] transition-colors mb-1">
                {card.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed line-clamp-2">
                {card.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
