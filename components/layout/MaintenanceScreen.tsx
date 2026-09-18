'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, Shield, Sparkles, Clock, Lock } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
}

export function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Brand Bar */}
      <header className="w-full py-6 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Student<span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Scheduled Maintenance</span>
          </div>
        </div>
      </header>

      {/* Main Notice Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 dark:from-indigo-950 dark:to-violet-950 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Wrench className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Under Scheduled Maintenance
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
              {message ||
                'StudentAI is currently undergoing scheduled platform maintenance and upgrades. Our student tools and AI services will return shortly.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 shadow-xs">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All user local data and backups saved in your browser remain completely intact.</span>
          </div>
        </div>
      </main>

      {/* Footer with Discreet Staff Portal Link */}
      <footer className="w-full py-6 px-4 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} StudentAI. Study Smarter. Prepare Better. Get Things Done.</p>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff / Admin Portal</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
