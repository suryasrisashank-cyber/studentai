'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Pencil,
  Type,
  Square,
  Highlighter,
  EyeOff,
  PenTool,
  Undo2,
  Trash2,
  Check,
} from 'lucide-react';
import { EditorAnnotation } from '@/lib/pdf/editing/edit';

interface PdfEditorWorkspaceProps {
  pageImageUrl: string;
  pageNumber: number;
  totalPages: number;
  mode?: 'edit' | 'redact' | 'sign';
  onSaveAnnotations: (annotations: EditorAnnotation[]) => void;
  onPageChange?: (newPage: number) => void;
}

export function PdfEditorWorkspace({
  pageImageUrl,
  pageNumber,
  totalPages,
  mode = 'edit',
  onSaveAnnotations,
  onPageChange,
}: PdfEditorWorkspaceProps) {
  const [tool, setTool] = useState<'text' | 'draw' | 'rect' | 'highlight' | 'redact' | 'sign'>(
    mode === 'redact' ? 'redact' : mode === 'sign' ? 'sign' : 'draw'
  );
  const [color, setColor] = useState('#2563eb');
  const [fontSize, setFontSize] = useState(16);
  const [annotations, setAnnotations] = useState<EditorAnnotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pt = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(pt);

    if (tool === 'draw') {
      setCurrentPath([pt]);
    } else if (tool === 'text') {
      const text = prompt('Enter text to place on document:');
      if (text) {
        setAnnotations((prev) => [
          ...prev,
          {
            type: 'text',
            pageIndex: pageNumber - 1,
            x: pt.x,
            y: pt.y,
            text,
            fontSize,
            color,
          },
        ]);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pt = getCanvasCoords(e);

    if (tool === 'draw') {
      setCurrentPath((prev) => [...prev, pt]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'draw' && currentPath.length > 1) {
      setAnnotations((prev) => [
        ...prev,
        {
          type: 'draw',
          pageIndex: pageNumber - 1,
          x: 0,
          y: 0,
          points: currentPath,
          color,
          strokeWidth: 3,
        },
      ]);
      setCurrentPath([]);
    } else if ((tool === 'rect' || tool === 'highlight' || tool === 'redact') && startPoint) {
      const endPt = getCanvasCoords(e);
      const x = Math.min(startPoint.x, endPt.x);
      const y = Math.min(startPoint.y, endPt.y);
      const width = Math.abs(endPt.x - startPoint.x);
      const height = Math.abs(endPt.y - startPoint.y);

      if (width > 5 && height > 5) {
        setAnnotations((prev) => [
          ...prev,
          {
            type: tool === 'redact' ? 'rect' : tool,
            pageIndex: pageNumber - 1,
            x,
            y,
            width,
            height,
            color: tool === 'redact' ? '#000000' : color,
            opacity: tool === 'highlight' ? 0.35 : 1.0,
          },
        ]);
      }
      setStartPoint(null);
    }
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    setAnnotations([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs overflow-x-auto text-xs">
        <div className="flex items-center gap-1 shrink-0">
          {mode !== 'redact' && (
            <>
              <button
                type="button"
                onClick={() => setTool('draw')}
                className={`p-2 rounded-xl flex items-center gap-1.5 font-semibold ${
                  tool === 'draw' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Freehand Pen"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Draw</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('text')}
                className={`p-2 rounded-xl flex items-center gap-1.5 font-semibold ${
                  tool === 'text' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Add Text"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Text</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('rect')}
                className={`p-2 rounded-xl flex items-center gap-1.5 font-semibold ${
                  tool === 'rect' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Draw Box"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Box</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('highlight')}
                className={`p-2 rounded-xl flex items-center gap-1.5 font-semibold ${
                  tool === 'highlight' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Highlighter"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Highlight</span>
              </button>
            </>
          )}

          {mode === 'redact' && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-black text-white font-bold inline-flex items-center gap-1.5 text-xs shadow-xs"
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-500" />
              <span>Redaction Mode (Permanent Erasure)</span>
            </button>
          )}
        </div>

        {/* Color picker */}
        {mode !== 'redact' && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer overflow-hidden p-0"
              title="Pick color"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={annotations.length === 0}
            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 disabled:opacity-40"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative max-w-2xl mx-auto border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-900 select-none flex items-center justify-center p-2"
      >
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pageImageUrl}
            alt={`Page ${pageNumber}`}
            className="max-h-[650px] w-auto object-contain pointer-events-none rounded-xl"
          />

          {/* SVG Overlay for Vector Elements */}
          <svg
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Render committed annotations */}
            {annotations.map((ann, i) => {
              if (ann.type === 'text') {
                return (
                  <text key={i} x={ann.x} y={ann.y} fill={ann.color} fontSize={ann.fontSize} fontWeight="bold">
                    {ann.text}
                  </text>
                );
              }
              if (ann.type === 'rect') {
                return (
                  <rect
                    key={i}
                    x={ann.x}
                    y={ann.y}
                    width={ann.width}
                    height={ann.height}
                    fill={ann.color}
                    opacity={ann.opacity}
                  />
                );
              }
              if (ann.type === 'highlight') {
                return (
                  <rect
                    key={i}
                    x={ann.x}
                    y={ann.y}
                    width={ann.width}
                    height={ann.height}
                    fill={ann.color || '#facc15'}
                    opacity={0.35}
                  />
                );
              }
              if (ann.type === 'draw' && ann.points) {
                const d = ann.points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
                return (
                  <path
                    key={i}
                    d={d}
                    stroke={ann.color}
                    strokeWidth={ann.strokeWidth || 3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              }
              return null;
            })}

            {/* In-progress drawing path */}
            {isDrawing && tool === 'draw' && currentPath.length > 1 && (
              <path
                d={currentPath.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')}
                stroke={color}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Save Button */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => onSaveAnnotations(annotations)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
        >
          <Check className="w-4 h-4" />
          <span>Apply & Save Changes</span>
        </button>
      </div>
    </div>
  );
}
