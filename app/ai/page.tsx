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

export default function AIPage() {
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
      <StudentAIChat />
    </div>
  );
}
