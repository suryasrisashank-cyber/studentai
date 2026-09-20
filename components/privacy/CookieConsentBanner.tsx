'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Cookie,
  SlidersHorizontal,
  X,
  Check,
  Info,
} from 'lucide-react';
import {
  getConsentPreferences,
  saveConsentPreferences,
  acceptAllCookies,
  rejectAllCookies,
  OPEN_CONSENT_MODAL_EVENT,
  CONSENT_UPDATED_EVENT,
  ConsentPreferences,
} from '@/lib/privacy/consent';

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Customization state
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getConsentPreferences();
    if (!existing) {
      // No decision made yet: show banner
      setShowBanner(true);
    } else {
      setFunctional(existing.functional);
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }

    const handleOpenModal = () => {
      const current = getConsentPreferences();
      if (current) {
        setFunctional(current.functional);
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setShowModal(true);
    };

    const handleConsentUpdated = (e: Event) => {
      const custom = e as CustomEvent<ConsentPreferences>;
      if (custom.detail) {
        setFunctional(custom.detail.functional);
        setAnalytics(custom.detail.analytics);
        setMarketing(custom.detail.marketing);
      }
    };

    window.addEventListener(OPEN_CONSENT_MODAL_EVENT, handleOpenModal);
    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated);

    return () => {
      window.removeEventListener(OPEN_CONSENT_MODAL_EVENT, handleOpenModal);
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated);
    };
  }, []);

  if (!mounted) return null;

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
    setShowModal(false);
  };

  const handleRejectAll = () => {
    rejectAllCookies();
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    saveConsentPreferences({
      functional,
      analytics,
      marketing,
    });
    setShowBanner(false);
    setShowModal(false);
  };

  return (
    <>
      {/* Bottom Floating Consent Banner */}
      {showBanner && !showModal && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 flex-1 pr-0 md:pr-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-base">
                <Cookie className="w-5 h-5" />
                <span>We value your privacy</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                This site uses tracking technologies (like cookies and local storage) to enhance user experience, deliver customized content, analyze traffic, and ensure platform security. You can accept all, reject non-essential technologies, or manage your preferences.{' '}
                <Link
                  href="/privacy"
                  className="underline font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  Learn more in our Privacy Policy.
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Customize Settings</span>
              </button>

              <button
                type="button"
                onClick={handleRejectAll}
                className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center flex-1 md:flex-initial"
              >
                Reject All
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 w-full md:w-auto"
              >
                <Check className="w-4 h-4" />
                <span>Accept All Cookies</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Customization Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 my-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 id="cookie-preferences-title">Cookie &amp; Privacy Preferences</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Control how StudentAI uses cookies and on-device storage. Essential cookies cannot be turned off as they are needed for site reliability and security.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close preferences modal"
                onClick={() => setShowModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Strictly Necessary */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Strictly Necessary</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Always Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Required for site operation, administrative authentication sessions, CSRF token security, and core platform stability. Cannot be disabled.
                </p>
              </div>

              {/* Functional */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Functional Storage</span>
                  <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    <input
                      type="checkbox"
                      checked={functional}
                      onChange={(e) => setFunctional(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[8px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Preserves your selected theme (dark or light), active PDF workspace settings, and local calculation inputs between visits so you don&apos;t lose work.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Analytics &amp; Usage Telemetry</span>
                  <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[8px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sends anonymous tool open counts and heartbeat pings to our self-hosted server to monitor tool health and error rates. Zero personal content is ever collected.
                </p>
              </div>

              {/* Marketing / Personalization */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Personalization &amp; Learning Recommendations</span>
                  <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[8px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Helps suggest relevant study templates, exam preparation tools, and career resources suited to your study patterns.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRejectAll}
                className="min-h-[44px] w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reject All Non-Essential
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
