import React from 'react';
import { Metadata } from 'next';
import { StudentAIChat } from '@/components/ai/StudentAIChat';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'StudentAI Assistant – Free AI Study Assistant',
  description:
    'Ask questions, understand concepts, prepare for exams, practice interviews and get study help with StudentAI Assistant.',
  alternates: {
    canonical: 'https://studentai-five.vercel.app/ai',
  },
  openGraph: {
    title: 'StudentAI Assistant – Free AI Study Assistant',
    description:
      'Ask questions, understand concepts, prepare for exams, practice interviews and get study help with StudentAI Assistant.',
    url: 'https://studentai-five.vercel.app/ai',
    type: 'website',
  },
};

import { db } from '@/lib/db';
import { Bot, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AIPage() {
  const [aiSettings, aiWelcome] = await Promise.all([
    db.getSiteSetting('ai_settings', { enabled: true }),
    db.getSiteSetting('ai_welcome', {
      greeting: 'Ask. Learn. Understand.',
      subtitle: 'Your free educational assistant for conceptual clarity and exam prep.',
    }),
  ]);

  if (!aiSettings.enabled) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Assistant Temporarily Paused
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            StudentAI administrators have temporarily paused the AI study companion for platform maintenance or provider upgrades. Please check back shortly.
          </p>
          <div className="pt-2">
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Explore 20 Free Browser Utilities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="text-slate-900 dark:text-slate-200 font-medium">
          AI Assistant
        </span>
      </nav>

      {/* Main Interactive Chat Interface */}
      <StudentAIChat greeting={aiWelcome.greeting} subtitle={aiWelcome.subtitle} />
    </div>
  );
}
