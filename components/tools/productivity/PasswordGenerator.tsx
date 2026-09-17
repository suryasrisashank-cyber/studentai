'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  KeyRound,
  Copy,
  Check,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export function PasswordGenerator() {
  const tool = getToolBySlug('password-generator')!;

  const [length, setLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(false);

  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generatePassword = useCallback(() => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    if (avoidAmbiguous) {
      upper = upper.replace(/[IO]/g, '');
      lower = lower.replace(/[lo]/g, '');
      numbers = numbers.replace(/[01]/g, '');
    }

    let charset = '';
    const guaranteedChars: string[] = [];

    if (includeUpper) {
      charset += upper;
      guaranteedChars.push(upper[Math.floor(Math.random() * upper.length)]);
    }
    if (includeLower) {
      charset += lower;
      guaranteedChars.push(lower[Math.floor(Math.random() * lower.length)]);
    }
    if (includeNumbers) {
      charset += numbers;
      guaranteedChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
    }
    if (includeSymbols) {
      charset += symbols;
      guaranteedChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    if (!charset) {
      setPassword('');
      return;
    }

    // Use cryptographically secure browser random values
    const randomBytes = new Uint32Array(length);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomBytes);
    } else {
      for (let i = 0; i < length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 4294967296);
      }
    }

    const resultChars: string[] = [];
    for (let i = 0; i < length - guaranteedChars.length; i++) {
      const index = randomBytes[i] % charset.length;
      resultChars.push(charset[index]);
    }

    // Combine and shuffle guaranteed characters
    const combined = [...resultChars, ...guaranteedChars];
    // Fisher-Yates shuffle using crypto values
    for (let i = combined.length - 1; i > 0; i--) {
      const j = randomBytes[i % randomBytes.length] % (i + 1);
      const temp = combined[i];
      combined[i] = combined[j];
      combined[j] = temp;
    }

    setPassword(combined.join(''));
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols, avoidAmbiguous]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // Calculate entropy
  const entropy = (() => {
    let poolSize = 0;
    if (includeUpper) poolSize += 26;
    if (includeLower) poolSize += 26;
    if (includeNumbers) poolSize += 10;
    if (includeSymbols) poolSize += 26;
    if (poolSize === 0) return 0;
    return Math.round(length * Math.log2(poolSize));
  })();

  const getStrengthLabel = () => {
    if (entropy < 40) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (entropy < 65) return { label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-500' };
    if (entropy < 85) return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
    return { label: 'Very Strong', color: 'bg-indigo-500', text: 'text-indigo-500' };
  };

  const strength = getStrengthLabel();

  const handleCopy = async () => {
    if (!password) return;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setLength(16);
    setIncludeUpper(true);
    setIncludeLower(true);
    setIncludeNumbers(true);
    setIncludeSymbols(true);
    setAvoidAmbiguous(false);
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Generates cryptographically random numbers using window.crypto.getRandomValues().',
          'Passwords never touch any server or network connection.',
          '16+ character passwords with mixed cases, numbers, and symbols achieve 90+ bits of entropy.',
        ],
        faqs: [
          {
            q: 'Is it safe to generate passwords in the browser?',
            a: 'Yes. The Web Cryptography API provides cryptographically secure pseudo-random number generation directly on your device.',
          },
          {
            q: 'Does StudentAI save the passwords I generate?',
            a: 'No. Passwords are never saved, tracked, or cached in LocalStorage or any database.',
          },
        ],
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Security Alert Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Security Notice:</strong> Never share generated passwords over unsecured channels. Passwords are generated exclusively on this device and are never sent anywhere.
          </span>
        </div>

        {/* Display Box */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 font-mono text-lg sm:text-2xl text-slate-900 dark:text-white font-bold break-all select-all">
              {password || 'Select options below'}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={generatePassword}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Regenerate password"
                aria-label="Regenerate password"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!password}
                className="p-3.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-40"
                title="Copy password"
                aria-label="Copy password"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {copied && (
            <div className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Copied to clipboard safely!
            </div>
          )}

          {/* Strength Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                Entropy: <strong>{entropy} bits</strong>
              </span>
              <span className={`font-bold ${strength.text}`}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${Math.min(100, (entropy / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password Length
              </label>
              <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {length} characters
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="48"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value) || 16)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUpper}
                onChange={(e) => setIncludeUpper(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Uppercase (A-Z)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLower}
                onChange={(e) => setIncludeLower(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Lowercase (a-z)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Numbers (0-9)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Symbols (!@#$%)
              </span>
            </label>

            <label className="sm:col-span-2 flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidAmbiguous}
                onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Avoid Ambiguous Characters (l, 1, I, O, 0)
              </span>
            </label>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
