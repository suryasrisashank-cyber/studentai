'use client';

import React from 'react';
import { StudentAI3DCap } from './StudentAI3DCap';

interface StudentAIHeroProps {
  greeting?: string;
  subtitle?: string;
}

export function StudentAIHero({
  greeting = 'Welcome to StudentAI',
  subtitle = 'Your intelligent study and teaching companion.',
}: StudentAIHeroProps) {
  return (
    <div className="relative w-full rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0C122C]/90 via-[#0E1738]/80 to-[#101435]/90 border border-slate-800/80 shadow-xl overflow-hidden mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#6D5DFB]/15 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-24 w-48 h-48 bg-[#3B82F6]/15 rounded-full filter blur-3xl pointer-events-none" />

      {/* Left Content */}
      <div className="relative z-10 max-w-xl text-left">
        <div className="text-xs sm:text-sm font-semibold tracking-wide text-slate-300 mb-1">
          {greeting}
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Learn. Build.{' '}
          <span className="bg-gradient-to-r from-[#6D5DFB] via-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent">
            Master.
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-2.5 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Right 3D Cap Graphic */}
      <div className="relative z-10 shrink-0 mt-2 sm:mt-0">
        <StudentAI3DCap size={160} />
      </div>
    </div>
  );
}
