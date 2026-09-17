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
            The StudentAI Zero-Cost Architecture
          </h2>
          <p>
            StudentAI was created with a fundamental technical constraint: <strong>it must operate at ₹0 upfront and ongoing infrastructure cost</strong>, while remaining free forever for every student who opens the website.
          </p>
          <p>
            To achieve this without compromising speed or reliability, we built the platform as a <strong>100% client-side, local-first application</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Zero Cloud Compute Overhead
              </h3>
              <p className="text-xs text-slate-500">
                Calculations and media manipulation execute directly in your browser using modern Web APIs.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                No Cloud Database or Login
              </h3>
              <p className="text-xs text-slate-500">
                You never have to create an account or provide personal credentials. Your data is stored safely in your own browser via LocalStorage.
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
