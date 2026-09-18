'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, CheckCircle2, Clock, Database, AlertCircle, Save, Bot } from 'lucide-react';

interface SettingsState {
  maintenance: { enabled: boolean; message: string };
  analyticsConfig: { activeWindowMinutes: number; retentionDays: number };
  aiSettings?: { enabled: boolean };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    maintenance: { enabled: false, message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.' },
    analyticsConfig: { activeWindowMinutes: 5, retentionDays: 30 },
    aiSettings: { enabled: true },
  });
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (maintenanceOverride?: boolean, aiOverride?: boolean) => {
    setSavedSuccess(null);
    const payload = {
      maintenance: {
        ...settings.maintenance,
        enabled: maintenanceOverride !== undefined ? maintenanceOverride : settings.maintenance.enabled,
      },
      aiSettings: {
        enabled: aiOverride !== undefined ? aiOverride : (settings.aiSettings?.enabled ?? true),
      },
      analyticsConfig: settings.analyticsConfig,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSettings(payload);
        setSavedSuccess('Settings saved successfully!');
        setTimeout(() => setSavedSuccess(null), 3000);
      }
    } catch {}
    finally {
      setShowConfirmModal(false);
    }
  };

  const handleMaintenanceToggleClick = () => {
    if (!settings.maintenance.enabled) {
      // Enabling maintenance requires confirmation
      setShowConfirmModal(true);
    } else {
      // Disabling maintenance happens immediately
      handleSave(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Settings & Controls</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure maintenance mode, active session window thresholds, and privacy retention rules.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{savedSuccess}</span>
        </div>
      )}

      {/* Maintenance Mode Card */}
      <div className={`p-6 rounded-3xl border shadow-xs space-y-4 transition-all ${
        settings.maintenance.enabled
          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className={`w-5 h-5 ${settings.maintenance.enabled ? 'text-amber-600' : 'text-slate-400'}`} />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Maintenance Mode</h3>
              <p className="text-[11px] text-slate-400">
                When enabled, public visitors see a maintenance notice. Admin routes remain 100% accessible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              settings.maintenance.enabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
            }`}>
              {settings.maintenance.enabled ? 'ACTIVE' : 'OFF'}
            </span>
            <button
              type="button"
              onClick={handleMaintenanceToggleClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                settings.maintenance.enabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {settings.maintenance.enabled ? 'Turn OFF' : 'Enable Maintenance'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Maintenance Notice Message for Public Visitors
          </label>
          <input
            type="text"
            maxLength={300}
            value={settings.maintenance.message}
            onChange={(e) =>
              setSettings({
                ...settings,
                maintenance: { ...settings.maintenance, message: e.target.value },
              })
            }
            className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
          />
        </div>
      </div>

      {/* AI Assistant Master Switch Card */}
      <div className={`p-6 rounded-3xl border shadow-xs space-y-4 transition-all ${
        (settings.aiSettings?.enabled ?? true)
          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Bot className={`w-5 h-5 ${(settings.aiSettings?.enabled ?? true) ? 'text-indigo-600' : 'text-amber-600'}`} />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Assistant Service Switch</h3>
              <p className="text-[11px] text-slate-400">
                Instantly enable or pause the AI Assistant (/ai), floating companion, and backend chat API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              (settings.aiSettings?.enabled ?? true) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {(settings.aiSettings?.enabled ?? true) ? 'ONLINE' : 'PAUSED'}
            </span>
            <button
              type="button"
              onClick={() => handleSave(undefined, !(settings.aiSettings?.enabled ?? true))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                (settings.aiSettings?.enabled ?? true)
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {(settings.aiSettings?.enabled ?? true) ? 'Emergency Pause AI' : 'Re-Enable AI'}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Retention Configuration */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Session & Retention Parameters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Session Window (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.analyticsConfig.activeWindowMinutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  analyticsConfig: {
                    ...settings.analyticsConfig,
                    activeWindowMinutes: parseInt(e.target.value, 10) || 5,
                  },
                })
              }
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-mono"
            />
            <p className="text-[10px] text-slate-400">
              Sessions sending heartbeats within this threshold are counted as &ldquo;Active Now&rdquo; (default: 5m).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Telemetry Retention Period (Days)
            </label>
            <input
              type="number"
              min={7}
              max={365}
              value={settings.analyticsConfig.retentionDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  analyticsConfig: {
                    ...settings.analyticsConfig,
                    retentionDays: parseInt(e.target.value, 10) || 30,
                  },
                })
              }
              className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-mono"
            />
            <p className="text-[10px] text-slate-400">
              Detailed event logs older than this are subject to scheduled privacy rotation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>

      {/* Confirmation Modal for Maintenance Mode */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Enable Maintenance Mode?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When Maintenance Mode is active, public students will see a maintenance notice instead of tools and calculations. You will still have full access to this admin dashboard to turn it off.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                Yes, Enable Maintenance Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
