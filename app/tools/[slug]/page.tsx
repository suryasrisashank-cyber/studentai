import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  TOOLS_REGISTRY,
  getToolBySlug,
  getAllToolSlugs,
} from '@/lib/tools-registry';

// Tool Components
import { CgpaCalculator } from '@/components/tools/student/CgpaCalculator';
import { PercentageCalculator } from '@/components/tools/student/PercentageCalculator';
import { AttendanceCalculator } from '@/components/tools/student/AttendanceCalculator';
import { StudyPlanner } from '@/components/tools/study/StudyPlanner';
import { PomodoroTimer } from '@/components/tools/study/PomodoroTimer';
import { QuickNotes } from '@/components/tools/study/QuickNotes';
import { WordCounter } from '@/components/tools/study/WordCounter';
import { TodoList } from '@/components/tools/productivity/TodoList';
import { PasswordGenerator } from '@/components/tools/productivity/PasswordGenerator';
import { TextCaseConverter } from '@/components/tools/everyday/TextCaseConverter';
import { TextCleaner } from '@/components/tools/everyday/TextCleaner';
import { UnitConverter } from '@/components/tools/everyday/UnitConverter';
import { AgeCalculator } from '@/components/tools/everyday/AgeCalculator';
import { DateCalculator } from '@/components/tools/everyday/DateCalculator';
import { QrCodeGenerator } from '@/components/tools/media/QrCodeGenerator';
import { ImageCompressor } from '@/components/tools/media/ImageCompressor';
import { ImageResizer } from '@/components/tools/media/ImageResizer';
import { ResumeKeywordChecker } from '@/components/tools/career/ResumeKeywordChecker';
import { JobDescriptionAnalyzer } from '@/components/tools/career/JobDescriptionAnalyzer';
import { InterviewQuestionBank } from '@/components/tools/career/InterviewQuestionBank';

interface ToolPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return getAllToolSlugs().map((slug) => ({
    slug,
  }));
}

export function generateMetadata({ params }: ToolPageProps): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Tool Not Found | StudentAI',
    };
  }

  return {
    title: `${tool.name} — Free Online Student Utility`,
    description: tool.seoDescription,
    keywords: tool.tags,
    openGraph: {
      title: `${tool.name} | StudentAI`,
      description: tool.seoDescription,
      type: 'website',
    },
  };
}

import { db } from '@/lib/db';
import Link from 'next/link';
import { AlertCircle, Wrench } from 'lucide-react';

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  // Check Maintenance Mode
  const maintenance = await db.getSiteSetting('maintenance_mode', { enabled: false, message: '' });
  if (maintenance.enabled) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Wrench className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">StudentAI Maintenance</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          {maintenance.message || 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.'}
        </p>
      </div>
    );
  }

  // Check Tool Enabled State
  const toolSettings = await db.getToolSettings();
  const setting = toolSettings.get(tool.slug);
  if (setting && !setting.isEnabled) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">This tool is currently unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          StudentAI administrators have temporarily disabled this utility for maintenance or updates. Please check back shortly or explore our other student utilities.
        </p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Explore Other Tools
        </Link>
      </div>
    );
  }

  // Component Map for all 20 tools
  switch (tool.slug) {
    case 'cgpa-calculator':
      return <CgpaCalculator />;
    case 'percentage-calculator':
      return <PercentageCalculator />;
    case 'attendance-calculator':
      return <AttendanceCalculator />;
    case 'study-planner':
      return <StudyPlanner />;
    case 'pomodoro':
      return <PomodoroTimer />;
    case 'notes':
      return <QuickNotes />;
    case 'word-counter':
      return <WordCounter />;
    case 'todo-list':
      return <TodoList />;
    case 'password-generator':
      return <PasswordGenerator />;
    case 'text-case-converter':
      return <TextCaseConverter />;
    case 'text-cleaner':
      return <TextCleaner />;
    case 'unit-converter':
      return <UnitConverter />;
    case 'age-calculator':
      return <AgeCalculator />;
    case 'date-calculator':
      return <DateCalculator />;
    case 'qr-generator':
      return <QrCodeGenerator />;
    case 'image-compressor':
      return <ImageCompressor />;
    case 'image-resizer':
      return <ImageResizer />;
    case 'resume-keyword-checker':
      return <ResumeKeywordChecker />;
    case 'job-description-analyzer':
      return <JobDescriptionAnalyzer />;
    case 'interview-questions':
      return <InterviewQuestionBank />;
    default:
      notFound();
  }
}
