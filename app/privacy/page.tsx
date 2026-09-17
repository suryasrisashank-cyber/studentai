import React from 'react';
import { Metadata } from 'next';
import { ShieldCheck, Lock, Database, Info, HardDrive } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Transparent Local-First Data Handling',
  description:
    'Learn how StudentAI processes tool data locally inside your browser with zero server tracking or document storage.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy & Data Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500">
          Last updated: September 2026 &bull; Effective immediately
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed space-y-1">
        <p className="font-semibold">Summary of Core Principles:</p>
        <p>
          &bull; <strong>Local Processing:</strong> Most StudentAI tools process your information directly in your browser.
        </p>
        <p>
          &bull; <strong>No Server Uploads:</strong> For tools that handle files or resumes, your file is processed in your browser and is not uploaded by StudentAI.
        </p>
        <p>
          &bull; <strong>No Tracking:</strong> StudentAI does not use third-party tracking cookies or advertising networks.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            1. In-Browser Local Processing
          </h2>
          <p>
            StudentAI is architected as a static, client-side web application. When you calculate your CGPA, format attendance records, compress images, generate passwords, or review resume keywords, the computations happen on your own device using browser JavaScript, Canvas APIs, and Web Cryptography.
          </p>
          <p>
            Your input data is not sent to a StudentAI server for calculation. Normal network requests are limited to the static asset requests required to load the website (HTML, CSS, JavaScript bundles, and web fonts).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            2. LocalStorage and Data Persistence
          </h2>
          <p>
            Certain tools—such as the Todo List, Quick Notes, Study Planner, and Interview Question Progress—offer persistent storage so you can resume work across browser sessions.
          </p>
          <p>
            This data is stored directly in your browser&apos;s <code>window.localStorage</code> using versioned keys prefixed with <code>studentai:v1:</code>. You maintain full ownership and control over this data:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>You can export your complete local data at any time as a standard JSON file (<code>studentai-data.json</code>).</li>
            <li>You can restore previously backed-up data into any browser.</li>
            <li>You can wipe all stored data using the Data Management modal or your browser&apos;s site data settings.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            3. File Handling and Media Processing
          </h2>
          <p>
            Tools such as the <strong>Image Compressor</strong> and <strong>Image Resizer</strong> read image files using the browser File and FileReader APIs. Image data is drawn onto an HTML5 <code>&lt;canvas&gt;</code> element in local system memory and re-encoded for download.
          </p>
          <p>
            At no point are your images, photos, or documents uploaded to any remote server or third-party cloud infrastructure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            4. Analytics, Cookies & Third Parties
          </h2>
          <p>
            StudentAI operates under a strict zero-cost, privacy-first commitment:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>We do not utilize Google Analytics, Hotjar, Facebook Pixel, or tracking scripts.</li>
            <li>We do not require user accounts, emails, or phone numbers.</li>
            <li>We do not sell, rent, or monetize your personal or behavioral data.</li>
          </ul>
          <p>
            If third-party hosting providers (such as GitHub Pages or Cloudflare) collect standard server access logs (such as IP addresses in web server connection logs), those are governed by the hosting provider&apos;s respective privacy terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            5. Contact and Open Source Verification
          </h2>
          <p>
            Because StudentAI is open-source, anyone may inspect the repository code to independently verify that calculations and file operations remain entirely client-side.
          </p>
        </section>
      </div>
    </div>
  );
}
