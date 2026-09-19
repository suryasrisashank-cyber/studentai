'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS_REGISTRY, CATEGORY_INFO, ToolCategory } from '@/lib/tools-registry';
import { ToolCard } from '@/components/tools/ToolCard';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Search,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [disabledTools, setDisabledTools] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.disabledTools)) setDisabledTools(d.disabledTools);
      })
      .catch(() => {});
  }, []);

  const filteredTools = searchQuery.trim()
    ? TOOLS_REGISTRY.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const popularTools = TOOLS_REGISTRY.filter((tool) => tool.isPopular);
  const categories = Object.keys(CATEGORY_INFO) as ToolCategory[];

  const faqs = [
    {
      q: 'How does StudentAI work?',
      a: 'StudentAI provides essential productivity, document, and study tools for students without paywalls, subscriptions, or credit card requirements. Standard tools run directly inside your browser.',
    },
    {
      q: 'Do I need to sign up or create an account?',
      a: 'No. You do not need to create an account, enter an email, connect Google, or provide a phone number. You can open any tool and start using it instantly.',
    },
    {
      q: 'Are my uploaded files, resumes, or grades sent to a server?',
      a: 'No. Supported tools process your data locally in your browser using client-side JavaScript, Canvas, and Web APIs. Your images, text, and documents are never uploaded to a StudentAI server.',
    },
    {
      q: 'Where is my data stored if I use the Todo List or Study Planner?',
      a: 'Data for persistent tools is saved locally in your browser using LocalStorage. You can also export all your data anytime as a JSON backup and restore it whenever needed.',
    },
    {
      q: 'Does StudentAI offer an AI Assistant?',
      a: 'Yes! In addition to local browser utilities, StudentAI includes a dedicated AI Assistant (/ai) with multi-provider redundancy (Google Gemini, Groq, OpenRouter) to help you explain concepts, draft essays, and solve problems.',
    },
    {
      q: 'Can I use StudentAI on my smartphone or tablet?',
      a: 'Yes. Every tool is mobile-first, fully responsive, and accessible on mobile browsers and tablets without installing any app.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-slate-900/60 dark:via-[#090d16] dark:to-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Productivity &bull; Local-First Utilities &bull; AI Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Study Smarter. Prepare Better.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              Get Things Done.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            StudentAI — Student Productivity, Study, Career & PDF Platform. Fast, private, and engineered for students.
          </p>

          {/* Quick Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any tool (e.g. CGPA, Attendance, Resume, Pomodoro)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm sm:text-base outline-none transition-all"
              />
            </div>

            {/* Instant Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-30 max-h-80 overflow-y-auto text-left">
                {filteredTools.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTools.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <DynamicIcon name={tool.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {tool.name}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {tool.description}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          Open &rarr;
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No tools found matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/tools"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all duration-200"
            >
              <span>Explore All {TOOLS_REGISTRY.length} Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#popular-tools"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <span>Popular Tools</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Popular Tools Section */}
      <section id="popular-tools" className="py-16 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Featured Utilities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Popular Student Tools
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Most frequented tools for exam prep, grade tracking, and productivity.
              </p>
            </div>
            <Link
              href="/tools"
              className="mt-4 md:mt-0 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View all {TOOLS_REGISTRY.length} tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                isDisabled={disabledTools.includes(tool.slug)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Explore by Category
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Designed for collegiate coursework, exam revisions, and career preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((catKey) => {
              const cat = CATEGORY_INFO[catKey];
              const count = TOOLS_REGISTRY.filter((t) => t.category === catKey).length;
              return (
                <Link
                  key={catKey}
                  href={`/tools?category=${catKey}`}
                  className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <DynamicIcon name={cat.icon} className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {cat.label}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {count} {count === 1 ? 'tool' : 'tools'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {cat.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why StudentAI Section */}
      <section className="py-16 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Why StudentAI?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Built as a pure utility platform with zero barriers to entry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Instant Access & Zero Sign-Up
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No subscription friction, no trial barriers, and no mandatory login. Open any tool and get immediate results.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Processed In Your Browser
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your grades, resumes, images, and notes are processed locally on your machine. We do not transmit your tool inputs to a database.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Offline & Export Ready
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Persistent tools store your data in LocalStorage. Export your notes and tasks to a JSON file anytime with full ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Honest answers about StudentAI&apos;s zero-cost architecture and privacy.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
