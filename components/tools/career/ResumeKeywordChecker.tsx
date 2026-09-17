'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  BarChart2,
  Info,
} from 'lucide-react';

// Common English stop words to filter out during tokenization
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'will', 'skills', 'experience', 'work', 'working', 'ability',
  'strong', 'years', 'team', 'teams', 'role', 'responsibilities', 'requirements', 'must', 'have',
]);

export function ResumeKeywordChecker() {
  const tool = getToolBySlug('resume-keyword-checker')!;

  const [resumeText, setResumeText] = useState<string>(
    `Computer Science student with experience in Python, SQL, React, and Git. Built REST APIs using Node.js and PostgreSQL. Familiar with Docker, Linux environment, unit testing, and agile methodologies.`
  );

  const [jobDescription, setJobDescription] = useState<string>(
    `Looking for a Junior Software Engineer proficient in Python, SQL, Docker, Kubernetes, and AWS. Experience with React, Node.js, Linux, CI/CD pipelines, and Git version control is required.`
  );

  // Deterministic local tokenization & keyword extraction
  const analysis = useMemo(() => {
    const extractKeywords = (text: string): Map<string, number> => {
      const words = text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9+#.-]+/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

      const freq = new Map<string, number>();
      words.forEach((w) => {
        freq.set(w, (freq.get(w) || 0) + 1);
      });
      return freq;
    };

    const resumeFreq = extractKeywords(resumeText);
    const jobFreq = extractKeywords(jobDescription);

    // Filter job keywords to significant terms (sorted by frequency in job description)
    const targetKeywords = Array.from(jobFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, jobCount: count }));

    const foundKeywords: { word: string; resumeCount: number; jobCount: number }[] = [];
    const missingKeywords: { word: string; jobCount: number }[] = [];

    targetKeywords.forEach((item) => {
      const inResume = resumeFreq.get(item.word);
      if (inResume && inResume > 0) {
        foundKeywords.push({ word: item.word, resumeCount: inResume, jobCount: item.jobCount });
      } else {
        missingKeywords.push({ word: item.word, jobCount: item.jobCount });
      }
    });

    const totalTarget = targetKeywords.length;
    const coveragePercent =
      totalTarget > 0 ? Math.round((foundKeywords.length / totalTarget) * 100) : 0;

    return {
      foundKeywords,
      missingKeywords,
      coveragePercent,
      totalTarget,
    };
  }, [resumeText, jobDescription]);

  const handleReset = () => {
    setResumeText('');
    setJobDescription('');
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Paste your resume text and the target job description into the fields.',
          'A client-side tokenization algorithm filters common stop-words and extracts relevant technical and functional terms.',
          'Compares vocabulary occurrences to reveal missing keywords and match percentage.',
        ],
        faqs: [
          {
            q: 'Does this score guarantee I will pass an ATS (Applicant Tracking System)?',
            a: 'No. This is a deterministic keyword comparison tool to help you identify missing terminology. It is not an employer score or hiring prediction.',
          },
          {
            q: 'Is my resume uploaded to a cloud server or AI model?',
            a: 'No. Your resume and job description remain entirely inside your local browser memory.',
          },
        ],
      }}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Important Disclaimer Notice */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong>Keyword-based analysis — not an employer prediction:</strong> This tool performs local text comparison to help students identify keywords mentioned in a job post that do not appear in their resume text. It does not predict recruiter decisions or hiring outcomes.
          </span>
        </div>

        {/* Text Input Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Your Resume Text</span>
              </label>
              <span className="text-xs text-slate-500">
                {resumeText.trim() ? `${resumeText.trim().split(/\s+/).length} words` : 'Empty'}
              </span>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={8}
              placeholder="Paste plain text from your resume or CV..."
              className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans"
            />
          </div>

          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>Target Job Description</span>
              </label>
              <span className="text-xs text-slate-500">
                {jobDescription.trim()
                  ? `${jobDescription.trim().split(/\s+/).length} words`
                  : 'Empty'}
              </span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the target job posting or internship description..."
              className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Results Analysis */}
        {analysis.totalTarget > 0 ? (
          <div className="p-6 sm:p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Keyword Overlap Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {analysis.foundKeywords.length} of {analysis.totalTarget} extracted keywords matched
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Keyword Coverage
                  </span>
                  <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {analysis.coveragePercent}%
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 text-lg border border-indigo-200 dark:border-indigo-800">
                  {analysis.foundKeywords.length}/{analysis.totalTarget}
                </div>
              </div>
            </div>

            {/* Keyword Comparison Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Keywords Found */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Keywords Found In Resume ({analysis.foundKeywords.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysis.foundKeywords.length > 0 ? (
                    analysis.foundKeywords.map((item) => (
                      <span
                        key={item.word}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >
                        <span>{item.word}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          (&times;{item.resumeCount})
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No overlapping keywords found.</span>
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <XCircle className="w-4 h-4" />
                  <span>Missing From Resume ({analysis.missingKeywords.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.length > 0 ? (
                    analysis.missingKeywords.map((item) => (
                      <span
                        key={item.word}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      >
                        <span>{item.word}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          ({item.jobCount} in job)
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">
                      Great! All target job keywords were found in your resume text.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            Enter both resume text and a job description to calculate keyword coverage.
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
