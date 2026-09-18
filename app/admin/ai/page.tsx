'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Zap, Shield, ArrowRight, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface AIProviderStats {
  requests: number;
  successes: number;
  failures: number;
  fallbacks: number;
  avgLatencyMs: number;
}

interface AIAdminData {
  telemetry: {
    available: boolean;
    providers: Record<string, AIProviderStats>;
  };
  providers: Record<string, { isConfigured: boolean; model: string }>;
  fallbackChain: string[];
  aiSettings?: { enabled: boolean };
}

export default function AdminAIPage() {
  const [data, setData] = useState<AIAdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingAI, setIsTogglingAI] = useState(false);

  const fetchAIData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  const handleToggleAI = async () => {
    if (!data) return;
    const currentStatus = data.aiSettings?.enabled ?? true;
    const newStatus = !currentStatus;
    setIsTogglingAI(true);
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus }),
      });
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, aiSettings: { enabled: newStatus } } : prev));
      }
    } catch {}
    finally {
      setIsTogglingAI(false);
    }
  };

  const providers = data?.providers || {};
  const stats = data?.telemetry?.providers || {};
  const isAiActive = data?.aiSettings?.enabled ?? true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Gateway Monitoring & Control</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational telemetry and emergency kill-switch for StudentAI multi-tier AI services.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAIData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* AI Assistant Master Kill-Switch Card */}
      <div
        className={`p-5 rounded-3xl border shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isAiActive
            ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
              isAiActive
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Assistant Platform Status</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isAiActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                }`}
              >
                {isAiActive ? 'ONLINE & ACTIVE' : 'PAUSED BY ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAiActive
                ? 'AI services are live on /ai, floating chat companion is active, and /api/ai/chat processes queries.'
                : 'AI services are paused. Floating chat is hidden, /ai displays maintenance notice, /api/ai/chat returns 503.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAI}
          disabled={isTogglingAI}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
            isAiActive
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isTogglingAI ? 'Updating...' : isAiActive ? 'Emergency Pause AI' : 'Re-Enable AI Assistant'}
        </button>
      </div>

      {/* Active Fallback Priority Chain */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Active Multi-Tier Fallback Order
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {(data?.fallbackChain || ['google', 'groq', 'openrouter']).map((p, idx, arr) => (
            <React.Fragment key={p}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 capitalize text-slate-900 dark:text-white">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{p}</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">
                  ({providers[p]?.model || 'default'})
                </span>
              </div>
              {idx < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Provider Status & Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {['google', 'groq', 'openrouter'].map((name) => {
          const p = providers[name];
          const s = stats[name] || { requests: 0, successes: 0, failures: 0, fallbacks: 0, avgLatencyMs: 0 };

          return (
            <div
              key={name}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black capitalize text-xs">
                    {name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">{name}</h3>
                    <p className="text-[10px] font-mono text-slate-400">{p?.model || '—'}</p>
                  </div>
                </div>

                <div>
                  {p?.isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Configured</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Not Set</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Requests</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{s.requests}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Latency</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {s.avgLatencyMs > 0 ? `${s.avgLatencyMs}ms` : '—'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Successes
                  </p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{s.successes}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Failures</p>
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{s.failures}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-100 dark:border-slate-800">
                <span>Fallback events triggered:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{s.fallbacks}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy & Confidentiality Guarantee */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
        <Shield className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Confidentiality Assurance:</strong> API keys are strictly evaluated on the server and are never rendered into HTML or responses. Raw student questions and model outputs are not stored in telemetry logs.
        </p>
      </div>
    </div>
  );
}
