'use client';

import React, { useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';

interface PdfSettingsSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function PdfSettingsSection({
  title,
  icon = <Settings className="w-3.5 h-3.5" />,
  defaultOpen = true,
  children,
}: PdfSettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 sm:py-3.5 touch-manipulation select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

interface PdfSettingsPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function PdfSettingsPanel({
  title = 'Tool Settings',
  children,
  className = '',
}: PdfSettingsPanelProps) {
  return (
    <aside className={`w-full lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0 ${className}`}>
      {title && (
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          {title}
        </h3>
      )}
      {children}
    </aside>
  );
}
