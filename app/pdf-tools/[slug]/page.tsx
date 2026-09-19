import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, Wrench, Bot } from 'lucide-react';
import { getPdfToolBySlug, getAllPdfToolSlugs } from '@/lib/pdf-tools-registry';
import { db } from '@/lib/db';
import { PdfToolClientWorkspace } from '@/components/pdf/PdfToolClientWorkspace';

interface PdfToolPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return getAllPdfToolSlugs().map((slug) => ({
    slug,
  }));
}

export function generateMetadata({ params }: PdfToolPageProps): Metadata {
  const tool = getPdfToolBySlug(params.slug);
  if (!tool) {
    return {
      title: 'PDF Tool Not Found | StudentAI',
    };
  }

  return {
    title: `${tool.name} — Free Online Student Utility | StudentAI`,
    description: tool.seoDescription,
    keywords: tool.tags,
    openGraph: {
      title: `${tool.name} | StudentAI`,
      description: tool.seoDescription,
      url: `https://studentai-five.vercel.app/pdf-tools/${tool.slug}`,
      type: 'website',
    },
  };
}

export default async function PdfToolPage({ params }: PdfToolPageProps) {
  const tool = getPdfToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  // 1. Server-Side Maintenance Mode Check
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

  // 2. Server-Side Tool Enabled/Disabled Kill Switch
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
          StudentAI administrators have temporarily disabled {tool.name} for scheduled maintenance or updates. Please check back shortly.
        </p>
        <Link
          href="/pdf-tools"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Explore Other PDF Tools
        </Link>
      </div>
    );
  }

  // 3. Server-Side AI Kill Switch Check (for AI-powered PDF tools)
  if (tool.requiresAI) {
    const aiSettings = await db.getSiteSetting('ai_settings', { enabled: true });
    if (!aiSettings.enabled) {
      return (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Assistant Temporarily Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The StudentAI AI Assistant features have been temporarily paused by the administrator. Please explore our 30 client-side PDF utilities in the meantime.
          </p>
          <Link
            href="/pdf-tools"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Back to PDF Tools
          </Link>
        </div>
      );
    }
  }

  // 4. Render client-side interactive workspace
  return <PdfToolClientWorkspace tool={tool} />;
}
