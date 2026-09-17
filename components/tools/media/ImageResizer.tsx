'use client';

import React, { useState, useRef } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  UploadCloud,
  Download,
  Lock,
  Unlock,
  Maximize2,
  FileImage,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export function ImageResizer() {
  const tool = getToolBySlug('image-resizer')!;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);

  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds the 25 MB browser safety limit.');
      return;
    }

    setErrorMessage(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImagePreview(src);

      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.naturalWidth);
        setOriginalHeight(img.naturalHeight);
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        resizeImage(src, img.naturalWidth, img.naturalHeight, format, quality);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (lockAspectRatio && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      const newHeight = Math.round(newWidth * ratio);
      setHeight(newHeight);
      if (imagePreview) resizeImage(imagePreview, newWidth, newHeight, format, quality);
    } else if (imagePreview) {
      resizeImage(imagePreview, newWidth, height, format, quality);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (lockAspectRatio && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      const newWidth = Math.round(newHeight * ratio);
      setWidth(newWidth);
      if (imagePreview) resizeImage(imagePreview, newWidth, newHeight, format, quality);
    } else if (imagePreview) {
      resizeImage(imagePreview, width, newHeight, format, quality);
    }
  };

  const applyScalePreset = (scaleFraction: number) => {
    if (originalWidth === 0) return;
    const newW = Math.round(originalWidth * scaleFraction);
    const newH = Math.round(originalHeight * scaleFraction);
    setWidth(newW);
    setHeight(newH);
    if (imagePreview) resizeImage(imagePreview, newW, newH, format, quality);
  };

  const resizeImage = (
    src: string,
    targetW: number,
    targetH: number,
    mime: string,
    qualityPercent: number
  ) => {
    if (targetW <= 0 || targetH <= 0) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage('Canvas context not available.');
        setIsProcessing(false);
        return;
      }

      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setResizedBlob(blob);
            if (resizedPreview) URL.revokeObjectURL(resizedPreview);
            setResizedPreview(URL.createObjectURL(blob));
          }
          setIsProcessing(false);
        },
        mime,
        qualityPercent / 100
      );
    };
    img.src = src;
  };

  const handleDownload = () => {
    if (!resizedBlob) return;
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const originalName = imageFile?.name.replace(/\.[^/.]+$/, '') || 'resized-image';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resizedBlob);
    a.download = `${originalName}-${width}x${height}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (resizedPreview) URL.revokeObjectURL(resizedPreview);
    setImagePreview(null);
    setResizedPreview(null);
    setResizedBlob(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Upload an image to resize dimensions.',
          'Type in new pixel values or use proportional scale buttons (75%, 50%, 25%).',
          'Keep aspect ratio locked to avoid distortion, or unlock for custom rectangular crops.',
          'Your file is processed in your browser and is not uploaded by StudentAI.',
        ],
        faqs: [
          {
            q: 'Can I resize transparent PNG images?',
            a: 'Yes, select PNG or WebP output to preserve alpha channel transparency.',
          },
        ],
      }}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
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
                Upload Image To Resize
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PNG, JPEG, WebP. Resized directly inside your browser.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dimension Controls */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {imageFile.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      Original: {originalWidth} &times; {originalHeight} px
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={format}
                    onChange={(e) => {
                      const nextMime = e.target.value as 'image/jpeg' | 'image/png' | 'image/webp';
                      setFormat(nextMime);
                      if (imagePreview) resizeImage(imagePreview, width, height, nextMime, quality);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
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

              {/* Dimensions Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center pt-2 sm:pt-5">
                  <button
                    type="button"
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      lockAspectRatio
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                    title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  >
                    {lockAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Quick scale presets */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs text-slate-500">Presets:</span>
                {[
                  { label: '75%', scale: 0.75 },
                  { label: '50%', scale: 0.5 },
                  { label: '25%', scale: 0.25 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyScalePreset(p.scale)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview & Download */}
            <div className="p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Resized Preview ({width} &times; {height} px)
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!resizedBlob || isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resized Image</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-video flex items-center justify-center p-4">
                {resizedPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resizedPreview}
                    alt="Resized output"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
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
