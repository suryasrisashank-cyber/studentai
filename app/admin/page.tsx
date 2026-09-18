'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  LogIn,
  Activity,
  Wrench,
  Bot,
  Calendar,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface DashboardData {
  metrics: {
    available: boolean;
    statusMessage: string;
    totalAnonymousSessions: number;
    activeSessions: number;
    sessionsToday: number;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
    totalToolUses: number;
    totalAIRequests: number;
    successfulAIRequests: number;
    failedAIRequests: number;
    registeredUsers: number;
    successfulLogins: number;
  };
  recentActivity: {
    id: string;
    timestamp: string;
    eventType: string;
    feature: string;
    sessionId: string;
  }[];
  systemStatus: {
    database: { connected: boolean; provider: string; message: string; isDevelopmentFallback: boolean };
    auth: { email: string; session: string };
    aiProviders: { google: string; groq: string; openrouter: string };
    telemetry: { activeWindowMinutes: number; status: string };
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to dashboard API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics;
  const status = data?.systemStatus;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-indigo-800/80 to-slate-900 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              Control Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">StudentAI Platform Overview</h2>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            Real-time aggregate usage monitoring, multi-provider AI routing telemetry, and tool management.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition-colors disabled:opacity-50 min-h-[38px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Error Notice with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Database Offline Warning if unconfigured */}
      {status?.database && !status.database.connected && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold">Production Database Notice</p>
            <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
              {status.database.message} Analytics will accumulate automatically once <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">DATABASE_URL</code> is configured in Vercel.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid (Figma SaaS Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Anonymous Sessions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Anonymous Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.totalAnonymousSessions ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Privacy-conscious anonymous sessions tracked via telemetry
            </p>
          </div>
        </div>

        {/* Card 2: Active Sessions (5m) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Sessions (5m)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isLoading ? '...' : (metrics?.activeSessions ?? 0)}</span>
              {(metrics?.activeSessions ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Active Now
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active browser sessions within the 5-minute heartbeat window
            </p>
          </div>
        </div>

        {/* Card 3: Sessions Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sessions Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.sessionsToday ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Distinct sessions active today since midnight
            </p>
          </div>
        </div>

        {/* Card 4: Sessions This Week */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sessions This Week
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.sessionsThisWeek ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active sessions recorded in the last 7 days
            </p>
          </div>
        </div>

        {/* Card 5: Sessions This Month */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sessions This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.sessionsThisMonth ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active sessions recorded in the last 30 days
            </p>
          </div>
        </div>

        {/* Card 6: Total Tool Uses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Tool Uses
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.totalToolUses ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Aggregate student utility usage events (zero private data logged)
            </p>
          </div>
        </div>

        {/* Card 7: Total AI Requests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total AI Requests
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.totalAIRequests ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Assistant gateway queries routed via Google, Groq, or OpenRouter
            </p>
          </div>
        </div>

        {/* Card 8: Successful vs Failed AI Requests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              AI Query Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400">
                {isLoading ? '...' : (metrics?.successfulAIRequests ?? 0)} <span className="text-xs font-normal text-slate-400">ok</span>
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                {isLoading ? '...' : (metrics?.failedAIRequests ?? 0)} <span className="text-xs font-normal text-slate-400">failed</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Successful completions vs upstream provider failures
            </p>
          </div>
        </div>

        {/* Card 9: Successful Admin Logins */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Admin Authentications
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading ? '...' : (metrics?.successfulLogins ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cryptographically verified admin authentication sessions
            </p>
          </div>
        </div>
      </div>

      {/* System Health & Status Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Card */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">System Health</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              Live
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Database Status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Database</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                status?.database?.connected
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}>
                {status?.database?.connected ? (status.database.isDevelopmentFallback ? 'Dev Local' : 'Neon Connected') : 'Unconfigured'}
              </span>
            </div>

            {/* Authentication Status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Authentication</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                HMAC Signed
              </span>
            </div>

            {/* AI Providers Status */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">AI Providers</span>
                </div>
                <Link href="/admin/ai" className="text-[10px] text-indigo-600 font-bold hover:underline">
                  View Telemetry &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400">Google</p>
                  <p className="text-[10px] font-bold capitalize text-slate-700 dark:text-slate-300">
                    {status?.aiProviders?.google ?? '—'}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400">Groq</p>
                  <p className="text-[10px] font-bold capitalize text-emerald-600 dark:text-emerald-400">
                    {status?.aiProviders?.groq ?? '—'}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400">OpenRouter</p>
                  <p className="text-[10px] font-bold capitalize text-slate-700 dark:text-slate-300">
                    {status?.aiProviders?.openrouter ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Activity</h3>
              <p className="text-[11px] text-slate-400">Real-time audit log of tool usage and system events</p>
            </div>
            <Link
              href="/admin/activity"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading activity feed...</div>
            ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No activity logged yet</p>
                <p className="text-[11px] text-slate-400">
                  Activity events will appear here as users open tools and interact with the AI assistant.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">Event</th>
                    <th className="py-2 px-2">Feature / Target</th>
                    <th className="py-2 px-2">Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {data.recentActivity.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.eventType === 'TOOL_USED'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : act.eventType === 'AI_REQUEST'
                            ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {act.eventType}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-900 dark:text-white">
                        {act.feature}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-slate-400">
                        {act.sessionId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
