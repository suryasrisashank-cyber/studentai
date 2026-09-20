'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, AlertCircle, CloudUpload, Folder } from 'lucide-react';
import { validateFileSize, validatePdfMagicBytes } from '@/lib/pdf/validation';
import { formatBytes } from '@/lib/pdf/utils';

interface PdfDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  title?: string;
  subtitle?: string;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function PdfDropzone({
  accept = '.pdf,application/pdf',
  multiple = false,
  maxSizeMB = 50,
  title,
  subtitle,
  onFilesSelected,
  disabled = false,
}: PdfDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const validFiles: File[] = [];
    const filesToTest = Array.from(fileList);

    for (const file of filesToTest) {
      // 1. File size check
      const sizeCheck = validateFileSize(file.size, maxSizeMB);
      if (!sizeCheck.valid) {
        setErrorMessage(sizeCheck.error || 'File too large');
        return;
      }

      // 2. Magic bytes check for PDF files
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const slice = await file.slice(0, 1024).arrayBuffer();
          const magicCheck = validatePdfMagicBytes(slice);
          if (!magicCheck.valid) {
            setErrorMessage(`"${file.name}" is corrupted or not a valid PDF.`);
            return;
          }
        } catch {
          setErrorMessage(`Unable to read "${file.name}".`);
          return;
        }
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="w-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-8">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => processFiles(e.target.files)}
          className="sr-only"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          aria-label="Upload document file"
          className={`
            w-full border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer
            transition-all touch-manipulation select-none flex flex-col items-center justify-center
            ${
              disabled
                ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800'
                : isDragOver
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
            }
          `}
        >
          {/* Vibrant Blue Squircle with Cloud Upload Icon (Exact Image 1) */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 mb-4">
            <CloudUpload className="w-8 h-8 stroke-[2.2]" />
          </div>

          <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            {title || (multiple ? 'Drop your files here' : 'Drop your file here')}
          </p>

          <span className="text-xs text-slate-400 font-medium my-2.5">or</span>

          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors touch-manipulation"
          >
            <Folder className="w-4 h-4" />
            <span>Browse files</span>
          </button>

          <p className="text-xs text-slate-400 mt-5">
            {accept.toUpperCase().replace(/\./g, '')} · up to {maxSizeMB} MB
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
