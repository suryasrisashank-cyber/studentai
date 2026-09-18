'use client';

import React, { useState, useEffect } from 'react';
import { FileEdit, Save, CheckCircle2, AlertCircle, Bell, Bot, ShieldAlert } from 'lucide-react';

interface ContentSettings {
  announcement: { enabled: boolean; text: string; type: string };
  aiWelcome: { greeting: string; subtitle: string };
  maintenance: { enabled: boolean; message: string };
}

export default function AdminContentPage() {
  const [settings, setSettings] = useState<ContentSettings>({
    announcement: { enabled: false, text: '', type: 'info' },
    aiWelcome: { greeting: 'Ask. Learn. Understand.', subtitle: '' },
    maintenance: { enabled: false, message: '' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/content')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveSection = async (section: 'announcement' | 'ai_welcome' | 'maintenance', data: unknown) => {
    setSavedSuccess(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      });
      if (res.ok) {
        setSavedSuccess(`Updated ${section.replace('_', ' ')} successfully!`);
        setTimeout(() => setSavedSuccess(null), 3000);
      }
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Website Content Management</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Safely customize live announcements, banners, and AI assistant text.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{savedSuccess}</span>
        </div>
      )}

      {/* Section 1: Global Homepage Announcement Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Announcement Banner</h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={settings.announcement.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcement: { ...settings.announcement, enabled: e.target.checked },
                })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Show on Homepage</span>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Banner Message
            </label>
            <input
              type="text"
              maxLength={280}
              placeholder="e.g. Welcome to the new semester! New tools added."
              value={settings.announcement.text}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcement: { ...settings.announcement, text: e.target.value },
                })
              }
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Banner Style
            </label>
            <select
              value={settings.announcement.type}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcement: { ...settings.announcement, type: e.target.value },
                })
              }
              className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="info">Info (Blue/Indigo)</option>
              <option value="success">Success (Emerald)</option>
              <option value="warning">Notice (Amber)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleSaveSection('announcement', settings.announcement)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Announcement</span>
          </button>
        </div>
      </div>

      {/* Section 2: AI Assistant Welcome Prompt */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Assistant Welcome Screen</h3>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Greeting Title
            </label>
            <input
              type="text"
              maxLength={100}
              value={settings.aiWelcome.greeting}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  aiWelcome: { ...settings.aiWelcome, greeting: e.target.value },
                })
              }
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subtitle Text
            </label>
            <input
              type="text"
              maxLength={200}
              value={settings.aiWelcome.subtitle}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  aiWelcome: { ...settings.aiWelcome, subtitle: e.target.value },
                })
              }
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSaveSection('ai_welcome', settings.aiWelcome)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save AI Greeting</span>
          </button>
        </div>
      </div>
    </div>
  );
}
