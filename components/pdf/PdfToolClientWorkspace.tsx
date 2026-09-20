'use client';

import React, { useState } from 'react';
import { PdfToolDefinition } from '@/lib/pdf/types';
import { SLUG_ALIASES } from '@/lib/pdf-tools-registry';
import { PdfToolkitLayout } from './PdfToolkitLayout';
import { PdfDropzone } from './PdfDropzone';
import { PdfFileList } from './PdfFileList';
import { PdfProgress } from './PdfProgress';
import { PdfResultCard } from './PdfResultCard';
import { PdfPageGrid } from './PdfPageGrid';
import { PdfEditorWorkspace } from './PdfEditorWorkspace';
import { PdfCameraScanner } from './PdfCameraScanner';
import { PdfCompareView } from './PdfCompareView';
import { PdfAiPanel } from './PdfAiPanel';
import { JpgToPdfWorkspace } from './JpgToPdfWorkspace';
import { PdfToJpgWorkspace } from './PdfToJpgWorkspace';

import { downloadUint8Array, readFileAsArrayBuffer, readFileAsDataUrl } from '@/lib/pdf/utils';
import { loadPdf } from '@/lib/pdf/core/load';
import { getPdfPageInfos } from '@/lib/pdf/core/pages';
import { renderPageToImage, extractAllPdfText } from '@/lib/pdf/core/rendering';

// Engine imports
import { mergePdfs } from '@/lib/pdf/organization/merge';
import { splitPdf } from '@/lib/pdf/organization/split';
import { organizePdf } from '@/lib/pdf/organization/organize';
import { removePdfPages } from '@/lib/pdf/organization/remove-pages';
import { extractPdfPages } from '@/lib/pdf/organization/extract-pages';
import { rotatePdf } from '@/lib/pdf/organization/rotate';
import { addPageNumbers } from '@/lib/pdf/organization/page-numbers';
import { convertImagesToPdf } from '@/lib/pdf/conversion/images-to-pdf';
import { convertPdfToImages } from '@/lib/pdf/conversion/pdf-to-images';
import { convertPdfToDocx } from '@/lib/pdf/conversion/pdf-to-docx';
import { convertPdfToXlsx } from '@/lib/pdf/conversion/pdf-to-xlsx';
import { convertPdfToPptx } from '@/lib/pdf/conversion/pdf-to-pptx';
import { convertDocxToPdf } from '@/lib/pdf/conversion/docx-to-pdf';
import { convertXlsxToPdf } from '@/lib/pdf/conversion/xlsx-to-pdf';
import { convertPptxToPdf } from '@/lib/pdf/conversion/pptx-to-pdf';
import { convertHtmlToPdf } from '@/lib/pdf/conversion/html-to-pdf';
import { preparePdfA } from '@/lib/pdf/conversion/pdf-a';
import { applyWatermark } from '@/lib/pdf/editing/watermark';
import { cropPdf } from '@/lib/pdf/editing/crop';
import { applyAnnotations } from '@/lib/pdf/editing/edit';
import { redactPdf } from '@/lib/pdf/editing/redact';
import { getFormFields, fillFormFields } from '@/lib/pdf/editing/forms';
import { compressPdf } from '@/lib/pdf/optimization/compress';
import { repairPdf } from '@/lib/pdf/optimization/repair';
import { protectPdf } from '@/lib/pdf/security/protect';
import { unlockPdf } from '@/lib/pdf/security/unlock';
import { comparePdfs, PdfComparisonResult } from '@/lib/pdf/security/compare';
import { runPdfOcr } from '@/lib/pdf/ocr/recognize';

export function PdfToolClientWorkspace({ tool }: { tool: PdfToolDefinition }) {
  const canonicalSlug = SLUG_ALIASES[tool.slug] || tool.slug;

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready' | 'error'>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [isZipOutput, setIsZipOutput] = useState(false);
  const [outputMimeType, setOutputMimeType] = useState('application/pdf');
  const [comparisonResult, setComparisonResult] = useState<PdfComparisonResult | null>(null);
  const [extractedText, setExtractedText] = useState('');

  // Tool specific options
  const [splitRanges, setSplitRanges] = useState('1-3');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [pageNumberPos, setPageNumberPos] = useState<any>('bottom-center');
  const [passwordInput, setPasswordInput] = useState('');
  const [htmlInput, setHtmlInput] = useState('<h1>Sample Assignment</h1><p>Type or paste your HTML here to convert to PDF.</p>');

  // Visual page grid state
  const [pageInfos, setPageInfos] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [activeEditorPage, setActiveEditorPage] = useState(1);
  const [editorPageImage, setEditorPageImage] = useState<string | null>(null);

  const resetAll = () => {
    setFiles([]);
    setStatus('idle');
    setProgressPercent(0);
    setProgressMessage('');
    setErrorMessage(null);
    setOutputBytes(null);
    setOutputFilename('');
    setIsZipOutput(false);
    setComparisonResult(null);
    setExtractedText('');
    setPageInfos([]);
    setSelectedPages(new Set());
    setEditorPageImage(null);
  };

  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    if (['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(canonicalSlug)) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles);
    }

    // Inspect first file if page manipulation or AI tool
    if (newFiles.length > 0 && newFiles[0].name.toLowerCase().endsWith('.pdf')) {
      try {
        const buffer = await readFileAsArrayBuffer(newFiles[0]);
        const doc = await loadPdf(buffer, { ignoreEncryption: true });
        const infos = getPdfPageInfos(doc);
        setPageInfos(infos);

        // Preload editor image for edit/redact/sign
        if (['edit-pdf', 'redact-pdf', 'sign-pdf'].includes(canonicalSlug)) {
          const imgUrl = await renderPageToImage(new Uint8Array(buffer), 1, 'image/png', 1.5);
          setEditorPageImage(imgUrl);
        }

        // Pre-extract text for AI, OCR, or comparison tools
        if (tool.requiresAI || ['ocr-pdf', 'compare-pdf', 'pdf-text'].includes(canonicalSlug)) {
          const textRes = await extractAllPdfText(new Uint8Array(buffer), 20);
          setExtractedText(textRes.text);
        }
      } catch {
        // Tolerant failure
      }
    }
  };

  const executeToolAction = async () => {
    if (files.length === 0 && canonicalSlug !== 'scan-to-pdf' && canonicalSlug !== 'html-to-pdf') {
      setErrorMessage('Please select a file to process.');
      return;
    }

    setStatus('processing');
    setProgressPercent(10);
    setProgressMessage('Initializing document...');

    try {
      const primaryFile = files[0];
      const baseName = primaryFile?.name.replace(/\.[^/.]+$/, '') || 'studentai_document';

      if (canonicalSlug === 'merge-pdf') {
        const buffers = await Promise.all(files.map((f) => readFileAsArrayBuffer(f)));
        const res = await mergePdfs(buffers, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_merged.pdf`);
        setOutputMimeType('application/pdf');
      } else if (canonicalSlug === 'split-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await splitPdf(buffer, splitRanges, baseName, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res.bytes);
        setOutputFilename(res.filename);
        setIsZipOutput(res.isZip);
        setOutputMimeType(res.isZip ? 'application/zip' : 'application/pdf');
      } else if (canonicalSlug === 'organize-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const configs = pageInfos.map((p) => ({ sourcePageIndex: p.pageNumber - 1, rotationAngle: p.rotation }));
        const res = await organizePdf(buffer, configs, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_organized.pdf`);
      } else if (canonicalSlug === 'remove-pages') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await removePdfPages(buffer, Array.from(selectedPages), (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_pages_removed.pdf`);
      } else if (canonicalSlug === 'extract-pages') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await extractPdfPages(buffer, Array.from(selectedPages), (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_extracted.pdf`);
      } else if (canonicalSlug === 'rotate-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const targets = selectedPages.size > 0 ? Array.from(selectedPages) : undefined;
        const res = await rotatePdf(buffer, rotationAngle, targets, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_rotated.pdf`);
      } else if (canonicalSlug === 'page-numbers') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await addPageNumbers(buffer, { position: pageNumberPos }, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_numbered.pdf`);
      } else if (canonicalSlug === 'watermark-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await applyWatermark(buffer, { type: 'text', text: watermarkText, opacity: watermarkOpacity }, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_watermarked.pdf`);
      } else if (canonicalSlug === 'crop-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await cropPdf(buffer, { top: 36, bottom: 36, left: 36, right: 36 }, undefined, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_cropped.pdf`);
      } else if (canonicalSlug === 'compress-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await compressPdf(buffer, 'balanced', (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res.bytes);
        setOutputFilename(`${baseName}_compressed.pdf`);
      } else if (canonicalSlug === 'repair-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await repairPdf(buffer, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_repaired.pdf`);
      } else if (canonicalSlug === 'protect-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await protectPdf(buffer, passwordInput, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_protected.pdf`);
      } else if (canonicalSlug === 'unlock-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await unlockPdf(buffer, passwordInput, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_unlocked.pdf`);
      } else if (canonicalSlug === 'pdf-to-word') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await convertPdfToDocx(new Uint8Array(buffer), baseName, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}.docx`);
        setOutputMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } else if (canonicalSlug === 'pdf-to-excel') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await convertPdfToXlsx(new Uint8Array(buffer), baseName, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}.xlsx`);
        setOutputMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if (canonicalSlug === 'pdf-to-powerpoint') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await convertPdfToPptx(new Uint8Array(buffer), baseName, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}.pptx`);
        setOutputMimeType('application/vnd.openxmlformats-officedocument.presentationml.presentation');
      } else if (canonicalSlug === 'word-to-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await convertDocxToPdf(buffer, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}.pdf`);
      } else if (canonicalSlug === 'excel-to-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const isCsv = primaryFile.name.toLowerCase().endsWith('.csv');
        const res = await convertXlsxToPdf(buffer, isCsv, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}.pdf`);
      } else if (canonicalSlug === 'powerpoint-to-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await convertPptxToPdf(buffer, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}.pdf`);
      } else if (canonicalSlug === 'html-to-pdf') {
        const res = await convertHtmlToPdf(htmlInput, 'HTML_Export', (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename('html_document.pdf');
      } else if (canonicalSlug === 'pdf-to-pdfa') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await preparePdfA(buffer, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename(`${baseName}_pdfa.pdf`);
      } else if (['pdf-to-jpg', 'pdf-to-png'].includes(canonicalSlug)) {
        const format = canonicalSlug === 'pdf-to-png' ? 'image/png' : 'image/jpeg';
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const res = await convertPdfToImages(new Uint8Array(buffer), pageInfos.length || 1, format, 1.5, baseName, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        if (res.isZip && res.zipBytes) {
          setOutputBytes(res.zipBytes);
          setOutputFilename(res.filename);
          setIsZipOutput(true);
          setOutputMimeType('application/zip');
        } else if (res.images[0]) {
          const base64 = res.images[0].dataUrl.replace(/^data:image\/\w+;base64,/, '');
          const bin = atob(base64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          setOutputBytes(bytes);
          setOutputFilename(res.filename);
          setOutputMimeType(format);
        }
      } else if (['jpg-to-pdf', 'png-to-pdf'].includes(canonicalSlug)) {
        const imageInputs = await Promise.all(
          files.map(async (f) => {
            const buf = await readFileAsArrayBuffer(f);
            return { bytes: new Uint8Array(buf), mimeType: f.type || 'image/jpeg', name: f.name };
          })
        );
        const res = await convertImagesToPdf(imageInputs, {}, (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setOutputBytes(res);
        setOutputFilename('images_assembled.pdf');
      } else if (canonicalSlug === 'compare-pdf') {
        if (files.length < 2) {
          throw new Error('Please upload 2 PDF files to compare.');
        }
        const bA = await readFileAsArrayBuffer(files[0]);
        const bB = await readFileAsArrayBuffer(files[1]);
        const res = await comparePdfs(new Uint8Array(bA), new Uint8Array(bB), (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        setComparisonResult(res);
        setStatus('ready');
        return;
      } else if (canonicalSlug === 'ocr-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const pNums = selectedPages.size > 0 ? Array.from(selectedPages).map((i) => i + 1) : [1];
        const res = await runPdfOcr(new Uint8Array(buffer), pNums, 'eng', (p, m) => { setProgressPercent(p); setProgressMessage(m); });
        const enc = new TextEncoder();
        setOutputBytes(enc.encode(res.fullText));
        setOutputFilename(`${baseName}_ocr_text.txt`);
        setOutputMimeType('text/plain');
      } else if (canonicalSlug === 'pdf-text') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const textRes = await extractAllPdfText(new Uint8Array(buffer), 100);
        const enc = new TextEncoder();
        setOutputBytes(enc.encode(textRes.text || 'No text found in document.'));
        setOutputFilename(`${baseName}_extracted_text.txt`);
        setOutputMimeType('text/plain');
      } else if (canonicalSlug === 'pdf-info') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const doc = await loadPdf(buffer, { ignoreEncryption: true });
        const info = `StudentAI Document Information Report\n` +
          `====================================\n\n` +
          `File Name: ${primaryFile.name}\n` +
          `File Size: ${(primaryFile.size / 1024).toFixed(1)} KB\n` +
          `Page Count: ${doc.getPageCount()}\n` +
          `Title: ${doc.getTitle() || 'Not specified'}\n` +
          `Author: ${doc.getAuthor() || 'Not specified'}\n` +
          `Subject: ${doc.getSubject() || 'Not specified'}\n` +
          `Keywords: ${doc.getKeywords() || 'Not specified'}\n` +
          `Producer: ${doc.getProducer() || 'Not specified'}\n` +
          `Creator: ${doc.getCreator() || 'Not specified'}\n` +
          `Creation Date: ${doc.getCreationDate() ? doc.getCreationDate()?.toISOString() : 'Unknown'}\n` +
          `Modification Date: ${doc.getModificationDate() ? doc.getModificationDate()?.toISOString() : 'Unknown'}\n`;
        const enc = new TextEncoder();
        setOutputBytes(enc.encode(info));
        setOutputFilename(`${baseName}_metadata_info.txt`);
        setOutputMimeType('text/plain');
      } else if (canonicalSlug === 'pdf-forms' || canonicalSlug === 'fill-pdf') {
        const buffer = await readFileAsArrayBuffer(primaryFile);
        const fields = await getFormFields(buffer);
        const formSummary = fields.length === 0
          ? 'No interactive AcroForm fields detected in this document.'
          : `Interactive Form Fields (${fields.length}):\n\n` +
            fields.map((f, i) => `${i + 1}. [${f.type.toUpperCase()}] ${f.name} = "${f.value}"`).join('\n');
        const enc = new TextEncoder();
        setOutputBytes(enc.encode(formSummary));
        setOutputFilename(`${baseName}_form_fields.txt`);
        setOutputMimeType('text/plain');
      }

      setStatus('ready');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDownload = () => {
    if (outputBytes && outputFilename) {
      downloadUint8Array(outputBytes, outputFilename, outputMimeType);
    }
  };

  return (
    <PdfToolkitLayout tool={tool} onReset={resetAll} showReset={files.length > 0 || status !== 'idle'}>
      {/* JPG/PNG to PDF — Professional Workspace (Phase 3 upgrade) */}
      {['jpg-to-pdf', 'png-to-pdf'].includes(canonicalSlug) && (
        <JpgToPdfWorkspace />
      )}

      {/* PDF to JPG — Dedicated Workspace */}
      {canonicalSlug === 'pdf-to-jpg' && (
        <PdfToJpgWorkspace />
      )}

      {/* 1. Progress State */}
      {!['jpg-to-pdf', 'png-to-pdf', 'pdf-to-jpg'].includes(canonicalSlug) && status === 'processing' && (
        <PdfProgress progress={progressPercent} message={progressMessage} onCancel={resetAll} />
      )}

      {/* 2. Result State */}
      {!['jpg-to-pdf', 'png-to-pdf', 'pdf-to-jpg'].includes(canonicalSlug) && status === 'ready' && outputBytes && (
        <PdfResultCard
          filename={outputFilename}
          outputBytes={outputBytes}
          originalSize={files[0]?.size}
          isZip={isZipOutput}
          onDownload={handleDownload}
          onReset={resetAll}
        />
      )}

      {/* 3. Comparison Result View */}
      {status === 'ready' && comparisonResult && files.length >= 2 && (
        <PdfCompareView
          filenameA={files[0].name}
          filenameB={files[1].name}
          comparison={comparisonResult}
          onReset={resetAll}
        />
      )}

      {/* 4. Scanner View */}
      {canonicalSlug === 'scan-to-pdf' && status === 'idle' && (
        <PdfCameraScanner
          onScanComplete={(bytes) => {
            setOutputBytes(bytes);
            setOutputFilename('scanned_document.pdf');
            setStatus('ready');
          }}
        />
      )}

      {/* 5. AI Panel */}
      {tool.requiresAI && status === 'idle' && (
        <div className="space-y-6">
          {files.length === 0 ? (
            <PdfDropzone
              title="Upload PDF for AI Analysis"
              subtitle="Text is extracted locally in your browser before analysis"
              onFilesSelected={handleFilesSelected}
            />
          ) : (
            <PdfAiPanel
              toolSlug={canonicalSlug}
              extractedText={extractedText}
              onRunAi={async (action, opts) => {
                const res = await fetch('/api/ai/pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action,
                    text: extractedText,
                    format: opts.format,
                    targetLanguage: opts.targetLanguage,
                  }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'AI Analysis failed');
                return json.text;
              }}
            />
          )}
        </div>
      )}

      {/* 6. HTML Input View */}
      {canonicalSlug === 'html-to-pdf' && status === 'idle' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Paste or Type HTML Content:
          </label>
          <textarea
            rows={8}
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <div className="text-center">
            <button
              type="button"
              onClick={executeToolAction}
              className="px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              Convert HTML to PDF
            </button>
          </div>
        </div>
      )}

      {/* 7. General File Upload & Tool Controls */}
      {status === 'idle' && canonicalSlug !== 'scan-to-pdf' && canonicalSlug !== 'html-to-pdf' && !tool.requiresAI && !['jpg-to-pdf', 'png-to-pdf', 'pdf-to-jpg'].includes(canonicalSlug) && (
        <div className="space-y-6">
          {files.length === 0 ? (
            <PdfDropzone
              accept={tool.supportedInputTypes.join(',')}
              multiple={['merge-pdf', 'jpg-to-pdf', 'png-to-pdf', 'compare-pdf'].includes(canonicalSlug)}
              maxSizeMB={tool.maxFileSizeMB}
              onFilesSelected={handleFilesSelected}
            />
          ) : (
            <div className="space-y-6">
              <PdfFileList
                files={files}
                onRemove={(idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                allowReorder={['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(canonicalSlug)}
                onAddMore={
                  ['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(canonicalSlug) || (canonicalSlug === 'compare-pdf' && files.length < 2)
                    ? () => {}
                    : undefined
                }
              />

              {/* Visual Page Grid for Reorder/Organize/Remove/Extract */}
              {['organize-pdf', 'remove-pages', 'extract-pages', 'rotate-pdf', 'ocr-pdf'].includes(canonicalSlug) && pageInfos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 text-center">
                    {canonicalSlug === 'remove-pages'
                      ? 'Select pages you wish to DELETE permanently:'
                      : canonicalSlug === 'extract-pages'
                      ? 'Select pages you wish to EXTRACT into a new PDF:'
                      : 'Preview and manage document pages:'}
                  </p>
                  <PdfPageGrid
                    pages={pageInfos}
                    selectedIndices={selectedPages}
                    onToggleSelect={(idx) => {
                      setSelectedPages((prev) => {
                        const next = new Set(prev);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        return next;
                      });
                    }}
                    onRotatePage={
                      canonicalSlug === 'organize-pdf'
                        ? (idx, deg) => {
                            setPageInfos((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + deg) % 360 } : p))
                            );
                          }
                        : undefined
                    }
                    onDeletePage={
                      canonicalSlug === 'organize-pdf'
                        ? (idx) => setPageInfos((prev) => prev.filter((_, i) => i !== idx))
                        : undefined
                    }
                  />
                </div>
              )}

              {/* Interactive Editor Workspace */}
              {['edit-pdf', 'redact-pdf', 'sign-pdf'].includes(canonicalSlug) && editorPageImage && (
                <PdfEditorWorkspace
                  pageImageUrl={editorPageImage}
                  pageNumber={activeEditorPage}
                  totalPages={pageInfos.length || 1}
                  mode={canonicalSlug === 'redact-pdf' ? 'redact' : canonicalSlug === 'sign-pdf' ? 'sign' : 'edit'}
                  onSaveAnnotations={async (annotations) => {
                    setStatus('processing');
                    try {
                      const buffer = await readFileAsArrayBuffer(files[0]);
                      const res =
                        canonicalSlug === 'redact-pdf'
                          ? await redactPdf(
                              buffer,
                              annotations.map((a) => ({
                                pageIndex: a.pageIndex,
                                x: a.x,
                                y: a.y,
                                width: a.width || 100,
                                height: a.height || 30,
                              }))
                            )
                          : await applyAnnotations(buffer, annotations);

                      setOutputBytes(res);
                      setOutputFilename(`${files[0].name.replace(/\.pdf$/i, '')}_edited.pdf`);
                      setStatus('ready');
                    } catch (e: unknown) {
                      setStatus('error');
                      setErrorMessage(e instanceof Error ? e.message : 'Edit failed');
                    }
                  }}
                />
              )}

              {/* Tool Specific Inline Controls */}
              {canonicalSlug === 'split-pdf' && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Page Ranges to Extract (e.g. 1-3, 5 or &quot;all&quot;):
                  </label>
                  <input
                    type="text"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              )}

              {canonicalSlug === 'rotate-pdf' && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Rotation Angle:</label>
                  <div className="inline-flex gap-2">
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotationAngle(deg)}
                        className={`px-4 py-2 rounded-xl font-bold ${
                          rotationAngle === deg ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canonicalSlug === 'watermark-pdf' && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Watermark Text:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Opacity: {Math.round(watermarkOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {['protect-pdf', 'unlock-pdf'].includes(canonicalSlug) && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    {canonicalSlug === 'protect-pdf' ? 'Set Document Password:' : 'Enter Document Password:'}
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              )}

              {/* Action Trigger Button */}
              {!['edit-pdf', 'redact-pdf', 'sign-pdf'].includes(canonicalSlug) && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={executeToolAction}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-[0.99]"
                  >
                    <span>Process {tool.name}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error state display */}
      {status === 'error' && errorMessage && (
        <div className="w-full max-w-xl mx-auto p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs text-center space-y-3">
          <p className="font-bold">{errorMessage}</p>
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            Try Again
          </button>
        </div>
      )}
    </PdfToolkitLayout>
  );
}
