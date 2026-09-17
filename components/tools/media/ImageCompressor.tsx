'use client';

import React, { useState, useRef } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  UploadCloud,
  Download,
  ShieldCheck,
  AlertCircle,
  FileImage,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export function ImageCompressor() {
  const tool = getToolBySlug('image-compressor')!;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleFileSelect = (file: File) => {
    // Validate file MIME type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Limit client memory usage: maximum 25 MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 25 MB limit for in-browser processing.');
      return;
    }

    setErrorMessage(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      compressImage(result, quality, format);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (
    dataUrl: string,
    qualityPercent: number,
    mimeType: 'image/jpeg' | 'image/webp'
  ) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage('Canvas 2D context not supported on this browser.');
        setIsProcessing(false);
        return;
      }

      // Draw with white background in case of transparent PNG converted to JPEG
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const q = Math.max(0.05, Math.min(1.0, qualityPercent / 100));
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCompressedBlob(blob);
            if (compressedPreview) URL.revokeObjectURL(compressedPreview);
            setCompressedPreview(URL.createObjectURL(blob));
          } else {
            setErrorMessage('Browser compression failed.');
          }
          setIsProcessing(false);
        },
        mimeType,
        q
      );
    };
    img.onerror = () => {
      setErrorMessage('Could not load image. File may be corrupted.');
      setIsProcessing(false);
    };
    img.src = dataUrl;
  };

  const handleQualityChange = (val: number) => {
    setQuality(val);
    if (imagePreview) {
      compressImage(imagePreview, val, format);
    }
  };

  const handleFormatChange = (newFormat: 'image/jpeg' | 'image/webp') => {
    setFormat(newFormat);
    if (imagePreview) {
      compressImage(imagePreview, quality, newFormat);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    const ext = format === 'image/webp' ? 'webp' : 'jpg';
    const originalName = imageFile?.name.replace(/\.[^/.]+$/, '') || 'compressed-image';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(compressedBlob);
    a.download = `${originalName}-compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    setImagePreview(null);
    setCompressedBlob(null);
    setCompressedPreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reductionPercent =
    imageFile && compressedBlob
      ? Math.round(((imageFile.size - compressedBlob.size) / imageFile.size) * 100)
      : 0;

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Select or drop any JPEG, PNG, or WebP photo into the browser.',
          'HTML5 Canvas renders and re-encodes the image at your chosen compression quality.',
          'Your file is processed in your browser and is not uploaded by StudentAI.',
          'Download the optimized image with significant file size reduction.',
        ],
        faqs: [
          {
            q: 'Can I compress confidential assignment documents or ID photos safely?',
            a: 'Yes. Processing occurs in-memory inside your local browser. No photo is ever sent across the network.',
          },
        ],
      }}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Upload Dropzone */}
        {!imageFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-indigo-500 cursor-pointer transition-colors space-y-4"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Click or Drop Image to Compress
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PNG, JPEG, and WebP (up to 25 MB). 100% in-browser processing.
              </p>
            </div>
          </div>
        ) : (
          /* Compression Controls & Live Previews */
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {imageFile.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      Original: {formatFileSize(imageFile.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={format}
                    onChange={(e) =>
                      handleFormatChange(e.target.value as 'image/jpeg' | 'image/webp')
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="image/jpeg">Export as JPEG</option>
                    <option value="image/webp">Export as WebP</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  >
                    Change Image
                  </button>
                </div>
              </div>

              {/* Quality Slider */}
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Compression Quality
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {quality}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={quality}
                  onChange={(e) => handleQualityChange(parseInt(e.target.value) || 75)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Original Card */}
              <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">
                    Original
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatFileSize(imageFile.size)}
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-video flex items-center justify-center">
                  {imagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Original preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Compressed Card */}
              <div className="p-4 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Compressed
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {compressedBlob ? formatFileSize(compressedBlob.size) : 'Calculating...'}
                      </span>
                      {reductionPercent > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          -{reductionPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-video flex items-center justify-center">
                    {compressedPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={compressedPreview}
                        alt="Compressed preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!compressedBlob || isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed Image</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
