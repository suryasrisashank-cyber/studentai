'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { triggerOpenConsentModal } from '@/lib/privacy/consent';

interface CookiePreferencesButtonProps {
  className?: string;
  variant?: 'link' | 'button';
}

export function CookiePreferencesButton({
  className = '',
  variant = 'link',
}: CookiePreferencesButtonProps) {
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => triggerOpenConsentModal()}
        className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors ${className}`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Manage Cookie &amp; Privacy Preferences</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => triggerOpenConsentModal()}
      className={`text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${className}`}
    >
      Cookie Preferences
    </button>
  );
}
