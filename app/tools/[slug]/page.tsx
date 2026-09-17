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

export default function ToolPage({ params }: ToolPageProps) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    notFound();
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
