import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                Student<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed font-medium">
              Study Smarter. Prepare Better. Get Things Done.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              StudentAI is a collection of free, client-side digital utilities designed to empower students and job seekers with zero upfront costs, zero registration, and zero cloud tracking.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>StudentAI processes supported tool data locally in your browser.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/tools?category=student" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Student Calculators
                </Link>
              </li>
              <li>
                <Link href="/tools?category=study" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Study & Focus Tools
                </Link>
              </li>
              <li>
                <Link href="/tools?category=career" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Career & Interview Prep
                </Link>
              </li>
              <li>
                <Link href="/tools?category=productivity" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Productivity & Tasks
                </Link>
              </li>
              <li>
                <Link href="/tools?category=media" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Documents & Media
                </Link>
              </li>
              <li>
                <Link href="/tools?category=everyday" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Everyday Utilities
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Project Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Platform & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-indigo-600 dark:text-indigo-400">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Browse All Tools
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About StudentAI
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} StudentAI. Free open-source student utilities. Built for students worldwide.
          </p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>and ₹0 operating cost.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
