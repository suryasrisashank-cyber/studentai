import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Zap,
  Code2,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About StudentAI — Zero-Cost Student Utility Mission',
  description:
    'Discover the mission behind StudentAI: free, fast, browser-based utilities designed for students without paywalls or subscriptions.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Core Philosophy</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Built for Students, With Zero Cost.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          StudentAI is designed to provide practical, accessible digital tools for students, fresh graduates, and everyday learners.
        </p>
      </div>

      {/* Main Narrative */}
      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6 text-sm sm:text-base leading-relaxed">
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            The Problem With Modern Student Software
          </h2>
          <p>
            Students often need simple, recurring digital tasks done quickly: calculating attendance before exam hall tickets are locked, projecting semester CGPA, timing study sessions, formatting text, compressing photos for university portals, or prepping for campus placement interviews.
          </p>
          <p>
            Unfortunately, modern utility platforms have become cluttered with mandatory sign-up screens, paywalls, monthly subscription models, and intrusive third-party trackers that compromise user privacy.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            The StudentAI Architecture
          </h2>
          <p>
            StudentAI is built as a high-performance student productivity suite: <strong>private, lightweight, and accessible to students worldwide</strong> with zero friction and zero forced account creation.
          </p>
          <p>
            To achieve this without compromising speed, privacy, or reliability, we built the platform combining <strong>local-first browser utilities</strong> with an intelligent <strong>server-side AI study gateway</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                20 Local-First Student Tools
              </h3>
              <p className="text-xs text-slate-500">
                Calculations, grading algorithms, and file compression execute directly in your browser using modern Web APIs without cloud compute delays.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Multi-Provider AI Study Assistant
              </h3>
              <p className="text-xs text-slate-500">
                When students need explanations or tutoring, queries route through a zero-cost server proxy across Google Gemini, Groq, and OpenRouter with automatic failover.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Ready to study smarter?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Explore our complete collection of 20 client-side student utilities. No installation, accounts, or payment needed.
          </p>
          <div className="pt-2">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 text-sm"
            >
              <span>Explore All Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
