'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  Sliders,
  Play,
  Save,
  Clock,
  ShieldAlert,
  Server,
  Layers,
} from 'lucide-react';
import { AISiteSettings, AIProviderName, AIProviderStatus } from '@/lib/ai/types';
import { ModelMetadata } from '@/lib/ai/models/catalog';

interface ProviderInfo {
  name: AIProviderName;
  isConfigured: boolean;
  isAvailable: boolean;
  isOperational: boolean;
  status: AIProviderStatus;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  catalog: ModelMetadata[];
}

interface AIAdminData {
  telemetry: {
    available: boolean;
    providers: Record<
      string,
      {
        requests: number;
        successes: number;
        failures: number;
        fallbacks: number;
        avgLatencyMs: number;
      }
    >;
  };
  providers: Record<AIProviderName, ProviderInfo>;
  fallbackChain: AIProviderName[];
  aiSettings: AISiteSettings;
}

interface TestConsoleResult {
  success: boolean;
  provider?: string;
  model?: string;
  statusState?: AIProviderStatus;
  latencyMs: number;
  textSnippet?: string;
  retrievalUsed?: boolean;
  sourcesCount?: number;
  sources?: { title: string; domain: string; url: string }[];
  error?: string;
}

const PROVIDER_DISPLAY_NAMES: Record<AIProviderName, string> = {
  google: 'Google Gemini',
  groq: 'Groq LPU',
  openrouter: 'OpenRouter Free Auto',
  bytez: 'Bytez API',
  atria: 'Atria AI Lab',
};

export default function AdminAIPage() {
  const [data, setData] = useState<AIAdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [globalKillSwitch, setGlobalKillSwitch] = useState(false);
  const [primaryProvider, setPrimaryProvider] = useState<AIProviderName>('google');
  const [secondaryProvider, setSecondaryProvider] = useState<AIProviderName>('groq');
  const [tertiaryProvider, setTertiaryProvider] = useState<AIProviderName>('openrouter');
  const [googleModel, setGoogleModel] = useState('');
  const [groqModel, setGroqModel] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('');
  const [bytezModel, setBytezModel] = useState('');
  const [atriaModel, setAtriaModel] = useState('');
  const [retrievalEnabled, setRetrievalEnabled] = useState(true);
  const [maxOutputTokens, setMaxOutputTokens] = useState(1500);

  // Test Console State
  const [testPrompt, setTestPrompt] = useState('What are the key concepts of dynamic programming in computer science?');
  const [testWithRetrieval, setTestWithRetrieval] = useState(true);
  const [testTargetProvider, setTestTargetProvider] = useState<string>('auto');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConsoleResult | null>(null);

  const fetchAIData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai');
      if (res.ok) {
        const json: AIAdminData = await res.json();
        setData(json);

        if (json.aiSettings) {
          setEnabled(json.aiSettings.enabled);
          setGlobalKillSwitch(Boolean(json.aiSettings.globalKillSwitch));
          setPrimaryProvider(json.aiSettings.primaryProvider || 'google');
          setSecondaryProvider(json.aiSettings.secondaryProvider || 'groq');
          setTertiaryProvider(json.aiSettings.tertiaryProvider || 'openrouter');
          setGoogleModel(json.aiSettings.googleModel || json.providers.google?.model || '');
          setGroqModel(json.aiSettings.groqModel || json.providers.groq?.model || '');
          setOpenrouterModel(json.aiSettings.openrouterModel || json.providers.openrouter?.model || '');
          setBytezModel(json.aiSettings.bytezModel || json.providers.bytez?.model || '');
          setAtriaModel(json.aiSettings.atriaModel || json.providers.atria?.model || '');
          setRetrievalEnabled(json.aiSettings.retrievalEnabled ?? true);
          setMaxOutputTokens(json.aiSettings.maxOutputTokens || 1500);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          globalKillSwitch,
          primaryProvider,
          secondaryProvider,
          tertiaryProvider,
          googleModel,
          groqModel,
          openrouterModel,
          bytezModel,
          atriaModel,
          retrievalEnabled,
          maxOutputTokens,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setData((prev) => (prev ? { ...prev, aiSettings: json.aiSettings } : prev));
        setSaveFeedback('AI settings saved successfully and loaded into active runtime.');
        setTimeout(() => setSaveFeedback(null), 4000);
      } else {
        const err = await res.json();
        setSaveFeedback(`Error: ${err.error || 'Failed to save settings'}`);
      }
    } catch {
      setSaveFeedback('Network error while updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    const nextKillState = !globalKillSwitch;
    setGlobalKillSwitch(nextKillState);
    if (nextKillState) {
      setEnabled(false);
    } else {
      setEnabled(true);
    }

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalKillSwitch: nextKillState,
          enabled: !nextKillState,
        }),
      });
      if (res.ok) {
        setSaveFeedback(nextKillState ? 'AI Kill Switch ENGAGED. All AI routes halted.' : 'AI Services re-enabled successfully.');
        setTimeout(() => setSaveFeedback(null), 4000);
      }
    } catch {}
  };

  const handleRunDiagnosticTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          testRetrieval: testWithRetrieval,
          provider: testTargetProvider !== 'auto' ? testTargetProvider : undefined,
        }),
      });
      const json: TestConsoleResult = await res.json();
      setTestResult(json);
      // Refresh status if test affected operational state
      fetchAIData();
    } catch {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: 'Failed to connect to diagnostic test endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const providers = data?.providers;
  const stats = data?.telemetry?.providers || {};
  const allProviderKeys: AIProviderName[] = ['google', 'groq', 'openrouter', 'bytez', 'atria'];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Control Center &amp; Diagnostics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational telemetry, tri-state provider health, 5-provider fallback architecture, and live test console.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAIData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {saveFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          saveFeedback.startsWith('Error')
            ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
        }`}>
          {saveFeedback.startsWith('Error') ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Master Kill-Switch Card */}
      <div
        className={`p-5 rounded-3xl border shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          !globalKillSwitch && enabled
            ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
              !globalKillSwitch && enabled
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            {globalKillSwitch ? <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" /> : <Bot className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Assistant Platform Status</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  !globalKillSwitch && enabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                {!globalKillSwitch && enabled ? 'ONLINE & ACTIVE' : 'KILL SWITCH ENGAGED (OFFLINE)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {!globalKillSwitch && enabled
                ? 'AI services are active on /ai, PDF AI tools process requests, and floating chat companion is enabled.'
                : 'Emergency kill switch is ACTIVE. All AI endpoints immediately reject requests with 503 before contacting upstream providers.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleKillSwitch}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 min-h-[44px] ${
            !globalKillSwitch && enabled
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {!globalKillSwitch && enabled ? 'Engage Global Kill Switch' : 'Disengage Kill Switch & Re-Enable AI'}
        </button>
      </div>

      {/* 5-Provider Tri-State Health & Telemetry Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Server className="w-4 h-4 text-indigo-500" />
            <span>AI Upstream Providers (3-State Status Model)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            States: <strong className="text-slate-700 dark:text-slate-300">CONFIGURED</strong> &bull; <strong className="text-indigo-600 dark:text-indigo-400">AVAILABLE</strong> &bull; <strong className="text-emerald-600 dark:text-emerald-400">OPERATIONAL</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProviderKeys.map((pName) => {
            const p = providers?.[pName];
            const stat = stats[pName] || { requests: 0, successes: 0, failures: 0, fallbacks: 0, avgLatencyMs: 0 };
            const isConfigured = Boolean(p?.isConfigured);
            const isAvailable = Boolean(p?.isAvailable);
            const isOperational = Boolean(p?.isOperational);

            return (
              <div
                key={pName}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {PROVIDER_DISPLAY_NAMES[pName]}
                    </span>
                    {primaryProvider === pName && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Tri-State Badges */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isConfigured
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED'}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isAvailable
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {isAvailable ? 'AVAILABLE' : 'INVALID_MODEL'}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOperational
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {isOperational ? 'OPERATIONAL' : 'STANDBY'}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Configured Model:</span>
                      <span className="font-mono text-slate-900 dark:text-white font-semibold truncate max-w-[150px]">
                        {p?.model || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{stat.avgLatencyMs || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {stat.requests > 0 ? Math.round((stat.successes / stat.requests) * 100) : 100}% ({stat.requests} reqs)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Runtime Configuration Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Priority &amp; Model Configuration</h3>
        </div>

        {/* Priority Order */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Provider</label>
            <select
              value={primaryProvider}
              onChange={(e) => setPrimaryProvider(e.target.value as AIProviderName)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            >
              <option value="google">Google Gemini (Default)</option>
              <option value="groq">Groq LPU</option>
              <option value="openrouter">OpenRouter Free Auto</option>
              <option value="bytez">Bytez API</option>
              <option value="atria">Atria AI Lab</option>
            </select>
          </div>

          {/* Secondary Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Secondary (1st Fallback)</label>
            <select
              value={secondaryProvider}
              onChange={(e) => setSecondaryProvider(e.target.value as AIProviderName)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            >
              <option value="groq">Groq LPU (Default)</option>
              <option value="google">Google Gemini</option>
              <option value="openrouter">OpenRouter Free Auto</option>
              <option value="bytez">Bytez API</option>
              <option value="atria">Atria AI Lab</option>
            </select>
          </div>

          {/* Tertiary Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tertiary (2nd Fallback)</label>
            <select
              value={tertiaryProvider}
              onChange={(e) => setTertiaryProvider(e.target.value as AIProviderName)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            >
              <option value="openrouter">OpenRouter Free Auto (Default)</option>
              <option value="bytez">Bytez API</option>
              <option value="atria">Atria AI Lab</option>
              <option value="google">Google Gemini</option>
              <option value="groq">Groq LPU</option>
            </select>
          </div>
        </div>

        {/* Model Selections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Google Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Google Gemini Model</label>
            <input
              type="text"
              value={googleModel}
              onChange={(e) => setGoogleModel(e.target.value)}
              placeholder="e.g. gemini-2.5-flash"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono min-h-[44px]"
            />
            <p className="text-[10px] text-slate-400">Default: gemini-2.5-flash</p>
          </div>

          {/* Groq Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Groq Model</label>
            <input
              type="text"
              value={groqModel}
              onChange={(e) => setGroqModel(e.target.value)}
              placeholder="e.g. openai/gpt-oss-120b"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono min-h-[44px]"
            />
            <p className="text-[10px] text-slate-400">Default: openai/gpt-oss-120b</p>
          </div>

          {/* OpenRouter Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">OpenRouter Model</label>
            <input
              type="text"
              value={openrouterModel}
              onChange={(e) => setOpenrouterModel(e.target.value)}
              placeholder="e.g. openrouter/free"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono min-h-[44px]"
            />
            <p className="text-[10px] text-slate-400">Default: openrouter/free</p>
          </div>

          {/* Bytez Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bytez Model</label>
            <input
              type="text"
              value={bytezModel}
              onChange={(e) => setBytezModel(e.target.value)}
              placeholder="e.g. meta-llama/Meta-Llama-3-8B-Instruct"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono min-h-[44px]"
            />
            <p className="text-[10px] text-slate-400">Default: meta-llama/Meta-Llama-3-8B-Instruct</p>
          </div>

          {/* Atria Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Atria Model</label>
            <input
              type="text"
              value={atriaModel}
              onChange={(e) => setAtriaModel(e.target.value)}
              placeholder="e.g. Atria-Dawn-Preview"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono min-h-[44px]"
            />
            <p className="text-[10px] text-slate-400">Default: Atria-Dawn-Preview</p>
          </div>

          {/* Max Output Tokens Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max Output Tokens Limit</label>
            <input
              type="number"
              value={maxOutputTokens}
              onChange={(e) => setMaxOutputTokens(parseInt(e.target.value) || 1500)}
              min={100}
              max={8000}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono min-h-[44px]"
            />
            <p className="text-[10px] text-slate-400">Allowed range: 100 - 8000 tokens</p>
          </div>
        </div>

        {/* Retrieval Switch */}
        <div className="pt-2">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Current-Data Web Grounding &amp; Citation Retrieval
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Ground answers for temporal queries via real-time search APIs.
              </p>
            </div>
            <input
              type="checkbox"
              checked={retrievalEnabled}
              onChange={(e) => setRetrievalEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Changes...' : 'Save AI Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Admin AI Test Console */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-500" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin AI Diagnostic Test Console</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Execute live diagnostic requests to verify model latency, fallback triggers, and retrieval without leaking secrets.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={2}
            placeholder="Enter test prompt..."
            className="w-full p-3 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-sans"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={testWithRetrieval}
                  onChange={(e) => setTestWithRetrieval(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span>Test with real-time web retrieval</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Target Provider:</span>
                <select
                  value={testTargetProvider}
                  onChange={(e) => setTestTargetProvider(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                >
                  <option value="auto">Auto Fallback Chain</option>
                  <option value="google">Google Gemini</option>
                  <option value="groq">Groq LPU</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="bytez">Bytez API</option>
                  <option value="atria">Atria AI Lab</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunDiagnosticTest}
              disabled={isTesting || !testPrompt.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 min-h-[44px]"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Executing Test...' : 'Run Diagnostic Test'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
            testResult.success
              ? 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  testResult.success ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {testResult.success ? 'TEST PASSED' : 'TEST FAILED'}
                </span>
                {testResult.provider && (
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    Provider: {testResult.provider} &bull; Model: {testResult.model}
                  </span>
                )}
                {testResult.statusState && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {testResult.statusState}
                  </span>
                )}
              </div>
              <span className="font-mono text-slate-500">Latency: {testResult.latencyMs}ms</span>
            </div>

            {testResult.success ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {testResult.textSnippet}
                </div>
                {testResult.retrievalUsed && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>Web retrieval used: {testResult.sourcesCount} verified sources found.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                Diagnostic Error: {testResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
