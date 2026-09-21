'use client';

import React from 'react';
import {
  Lightbulb,
  Code2,
  FileText,
  BookOpen,
  ArrowRight,
  Brain,
  Database,
  Calculator,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface StudentAIActionCardsProps {
  onSelectCard: (prompt: string) => void;
}

const PC_ACTION_CARDS = [
  {
    id: 'explain',
    badge: 'Explain',
    icon: Lightbulb,
    title: 'Explain a Concept',
    description: 'Get simple, intuitive explanations with real-world analogies.',
    prompt: 'Explain the core concept of process synchronization and race conditions in operating systems with real-world analogies and clear diagrams.',
    iconColor: 'text-[#38BDF8]',
    iconBg: 'bg-[#0E2442] border border-[#38BDF8]/30',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  {
    id: 'solve',
    badge: 'Solve',
    icon: Code2,
    title: 'Solve a Problem',
    description: 'Step-by-step mathematical proofs, logic, and clean code.',
    prompt: 'Help me solve this problem step-by-step with algorithm analysis, complexity derivation, and clean Python/C++ code: ',
    iconColor: 'text-[#60A5FA]',
    iconBg: 'bg-[#12224A] border border-[#60A5FA]/30',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  {
    id: 'exam',
    badge: 'Exam',
    icon: FileText,
    title: 'Exam Preparation',
    description: 'High-yield revision notes, 2-mark definitions & test questions.',
    prompt: 'Generate an exam revision sheet with high-yield key formulas, 2-mark definitions, and 10-mark practice questions for: ',
    iconColor: 'text-[#A78BFA]',
    iconBg: 'bg-[#231A4A] border border-[#A78BFA]/30',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: 'create',
    badge: 'Create',
    icon: BookOpen,
    title: 'Create Lesson / Notes',
    description: 'Generate structured lectures, study guides, and rubrics.',
    prompt: 'Create a structured 60-minute lesson plan and comprehensive study guide with learning outcomes, core lecture notes, and classroom activities on: ',
    iconColor: 'text-[#C084FC]',
    iconBg: 'bg-[#281745] border border-[#C084FC]/30',
    badgeBg: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
];

const MOBILE_CONTINUE_SUBJECTS = [
  {
    id: 'cs',
    name: 'Computer Science',
    icon: Code2,
    topic: 'Data Structures, Algorithms & OS',
    prompt: 'Explain fundamental Computer Science concepts: Big-O time complexity, balance in AVL trees, and process scheduling in OS.',
  },
  {
    id: 'ai-ml',
    name: 'AI & ML',
    icon: Brain,
    topic: 'Neural Networks & Loss Functions',
    prompt: 'Explain Artificial Intelligence & Machine Learning foundations: Gradient descent, backpropagation, and transformer attention.',
  },
  {
    id: 'dbms',
    name: 'DBMS',
    icon: Database,
    topic: 'SQL, Normalization & ACID Properties',
    prompt: 'Explain Database Management Systems: 1NF to BCNF normalization, indexing structures (B+ Trees), and ACID transaction guarantees.',
  },
  {
    id: 'math',
    name: 'Mathematics',
    icon: Calculator,
    topic: 'Calculus, Linear Algebra & Matrices',
    prompt: 'Break down Engineering Mathematics concepts step-by-step: Eigenvalues/eigenvectors, Fourier transforms, and multivariable calculus.',
  },
];

export function StudentAIActionCards({ onSelectCard }: StudentAIActionCardsProps) {
  return (
    <div className="mb-6 space-y-6">
      {/* Desktop View: [Explain] [Solve] [Exam] [Create] */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {PC_ACTION_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCard(card.prompt)}
              className="p-4 rounded-2xl bg-[#0C132E]/90 hover:bg-[#121B42] border border-slate-800/90 hover:border-[#6D5DFB]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6D5DFB]/10 text-left flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Row: Icon + Badge + Arrow */}
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${card.badgeBg}`}
                  >
                    [{card.badge}]
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
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

      {/* Mobile View: [Explain] [Ask AI] + Continue Learning */}
      <div className="block sm:hidden space-y-4">
        {/* Mobile Action Cards: [Explain] [Ask AI] */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() =>
              onSelectCard(
                'Explain the core concept of process synchronization and race conditions in operating systems with real-world analogies.'
              )
            }
            className="p-3.5 rounded-2xl bg-[#0C132E] border border-sky-500/30 text-left hover:bg-[#121B42] transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0E2442] flex items-center justify-center text-[#38BDF8]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                [Explain]
              </span>
            </div>
            <div className="text-xs font-bold text-white">Explain Concept</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Simple analogies</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectCard(
                'I want to ask StudentAI a question. Act as my personal university professor and guide me step-by-step through: '
              )
            }
            className="p-3.5 rounded-2xl bg-[#0C132E] border border-indigo-500/30 text-left hover:bg-[#121B42] transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#141C42] flex items-center justify-center text-[#8B5CF6]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                [Ask AI]
              </span>
            </div>
            <div className="text-xs font-bold text-white">Ask AI Anything</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Instant tutoring</p>
          </button>
        </div>

        {/* Continue Learning Subjects */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-white tracking-wide">Continue Learning</span>
            <span className="text-[10px] text-[#8B5CF6] font-medium">1-Tap Prompts</span>
          </div>

          <div className="space-y-1.5">
            {MOBILE_CONTINUE_SUBJECTS.map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectCard(sub.prompt)}
                  className="w-full p-2.5 rounded-xl bg-[#080D24] border border-slate-800/80 hover:border-[#6D5DFB]/40 hover:bg-[#0E1533] transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#11183A] flex items-center justify-center text-[#8B5CF6] shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {sub.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{sub.topic}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
