'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, Trash2, Plus, Sparkles } from 'lucide-react';
import { convertImagesToPdf } from '@/lib/pdf/conversion/images-to-pdf';

interface PdfCameraScannerProps {
  onScanComplete: (pdfBytes: Uint8Array) => void;
}

export function PdfCameraScanner({ onScanComplete }: PdfCameraScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPages, setCapturedPages] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'bw' | 'grayscale' | 'color'>('bw');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(media);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access denied or unsupported on this device. You can choose photos from your gallery.');
      setCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply filter
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    if (filterMode === 'bw') {
      // High contrast B&W threshold
      for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const v = avg > 125 ? 255 : 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filterMode === 'grayscale') {
      for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i] = avg;
        d[i + 1] = avg;
        d[i + 2] = avg;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPages((prev) => [...prev, dataUrl]);
  };

  const handleGeneratePdf = async () => {
    if (capturedPages.length === 0) return;
    stopCamera();

    const imageInputs = capturedPages.map((dataUrl, idx) => {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return { bytes, mimeType: 'image/jpeg', name: `Scan_Page_${idx + 1}.jpg` };
    });

    const pdfBytes = await convertImagesToPdf(imageInputs);
    onScanComplete(pdfBytes);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Viewfinder */}
      {cameraActive ? (
        <div className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4] max-h-[500px] flex items-center justify-center shadow-lg border border-slate-800">
          <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />

          {/* Filter options bar */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-center gap-2 z-10">
            <button
              type="button"
              onClick={() => setFilterMode('bw')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                filterMode === 'bw' ? 'bg-indigo-600 text-white' : 'bg-black/60 text-white/80'
              }`}
            >
              High Contrast B&W
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('grayscale')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                filterMode === 'grayscale' ? 'bg-indigo-600 text-white' : 'bg-black/60 text-white/80'
              }`}
            >
              Grayscale
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('color')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                filterMode === 'color' ? 'bg-indigo-600 text-white' : 'bg-black/60 text-white/80'
              }`}
            >
              Full Color
            </button>
          </div>

          {/* Capture Trigger */}
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-10">
            <button
              type="button"
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white bg-indigo-600 active:scale-95 shadow-lg flex items-center justify-center text-white transition-all"
              title="Capture Page"
            >
              <Camera className="w-7 h-7" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-center space-y-4 bg-white dark:bg-slate-900/60">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Mobile Document Scanner</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digitize physical textbook pages, assignments, or handwritten notes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Open Device Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileFallbackRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Plus className="w-4 h-4" />
              <span>Choose from Photos</span>
            </button>
          </div>

          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                Array.from(e.target.files).forEach((f) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCapturedPages((prev) => [...prev, reader.result as string]);
                  };
                  reader.readAsDataURL(f);
                });
              }
            }}
          />

          {cameraError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium max-w-md mx-auto">
              {cameraError}
            </p>
          )}
        </div>
      )}

      {/* Captured Pages Gallery */}
      {capturedPages.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Scanned Pages ({capturedPages.length})
            </span>
            <button
              type="button"
              onClick={handleGeneratePdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Create PDF from Scans</span>
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {capturedPages.map((url, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[3/4] bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Scan ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCapturedPages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
