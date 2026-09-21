'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { DataBackupModal } from '../tools/DataBackupModal';
import {
  Sparkles,
  Menu,
  X,
  Database,
  GraduationCap,
  BookOpen,
  Briefcase,
  CheckSquare,
  Wrench,
  Search,
  Bot,
  FileText,
} from 'lucide-react';

export function Header({ onOpenMobileTools }: { onOpenMobileTools?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{
    enabled: boolean;
    text: string;
    type: 'info' | 'warning' | 'success';
  } | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.announcement?.enabled && data.announcement.text) {
          try {
            const dismissedText = sessionStorage.getItem('studentai:dismissed_announcement');
            if (dismissedText !== data.announcement.text) {
              setAnnouncement(data.announcement);
            }
          } catch {
            setAnnouncement(data.announcement);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleDismissAnnouncement = () => {
    try {
      if (announcement?.text) {
        sessionStorage.setItem('studentai:dismissed_announcement', announcement.text);
      }
    } catch {}
    setAnnouncementDismissed(true);
  };

  const navLinks = [
    { href: '/tools', label: 'All Tools' },
    { href: '/pdf-tools', label: 'PDF Tools', icon: FileText },
    { href: '/ai', label: 'AI Assistant', icon: Bot },
    { href: '/tools?category=student', label: 'Student', icon: GraduationCap },
    { href: '/tools?category=study', label: 'Study', icon: BookOpen },
    { href: '/tools?category=career', label: 'Career', icon: Briefcase },
    { href: '/tools?category=productivity', label: 'Productivity', icon: CheckSquare },
    { href: '/tools?category=everyday', label: 'Everyday', icon: Wrench },
    { href: '/about', label: 'About' },
  ];

  return (
    <>
      {/* Dynamic Site-Wide Announcement Banner */}
      {announcement && announcement.enabled && !announcementDismissed && (
        <div
          className={`w-full py-2 px-4 text-xs font-semibold flex items-center justify-between gap-3 text-center transition-colors z-50 ${
            announcement.type === 'warning'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : announcement.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 text-white'
          }`}
        >
          <div className="flex-1 max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span>{announcement.text}</span>
          </div>
          <button
            type="button"
            onClick={handleDismissAnnouncement}
            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Dismiss announcement"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                    Student<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                    Student Suite
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  Productivity, Career & Document Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2">
              <Link
                href="/tools"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                title="Search Tools"
                aria-label="Search Tools"
              >
                <Search className="w-5 h-5" />
              </Link>

              <button
                type="button"
                onClick={() => setBackupModalOpen(true)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                title="Backup or Restore Local Data"
                aria-label="Backup or Restore Local Data"
              >
                <Database className="w-5 h-5" />
              </button>

              <ThemeToggle />

              {/* Launch AI CTA */}
              <Link
                href="/ai"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Launch AI</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenMobileTools) {
                    onOpenMobileTools();
                  } else {
                    setMobileMenuOpen(!mobileMenuOpen);
                  }
                }}
                className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600"
              >
                {link.icon && <link.icon className="w-5 h-5 text-indigo-500" />}
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setBackupModalOpen(true);
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Database className="w-4 h-4 text-indigo-500" />
                <span>Backup / Restore Data</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <DataBackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />
    </>
  );
}
