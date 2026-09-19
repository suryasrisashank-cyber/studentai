'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800'
            : isDragOver
            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragOver
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {isDragOver ? <UploadCloud className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title || (multiple ? 'Drop PDF files here' : 'Drop your PDF here')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle || 'or tap to browse files from your computer or phone'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <span>Max file size: {maxSizeMB} MB</span>
            <span>•</span>
            <span>Client-side local processing</span>
          </div>
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
