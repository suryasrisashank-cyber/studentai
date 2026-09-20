/**
 * StudentAI PDF Workspace Architecture — Core Types
 */

import { ProgressCallback } from '@/lib/pdf/types';

export type PdfToolMode =
  | 'merge'
  | 'split'
  | 'organize'
  | 'remove-pages'
  | 'extract-pages'
  | 'rotate'
  | 'jpg-to-pdf'
  | 'pdf-to-jpg'
  | 'compress'
  | 'ocr'
  | 'edit'
  | 'watermark'
  | 'sign'
  | 'crop'
  | 'redact'
  | 'compare'
  | 'ai-summary'
  | 'ai-chat'
  | 'study-guide'
  | 'translate'
  | 'general';

export interface PdfPage {
  id: string;
  pageNumber: number;
  thumbnailUrl?: string;
  rotation: number;
  selected: boolean;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface PdfProcessingResult {
  filename: string;
  bytes?: Uint8Array;
  size: number;
  mimeType: string;
  isZip?: boolean;
  pageCount?: number;
  downloadUrl?: string;
  images?: { pageNumber: number; dataUrl: string; filename: string; size: number }[];
}

export interface PdfWorkspaceState {
  uploadedFiles: File[];
  pages: PdfPage[];
  selectedPageIds: string[];
  activePageId: string | null;

  zoom: number; // 0.5 to 2.5
  rotation: number; // 0, 90, 180, 270

  isProcessing: boolean;
  progress: number;
  progressMessage?: string;

  error: string | null;

  result: PdfProcessingResult | null;
}

export function mapSlugToToolMode(slug: string): PdfToolMode {
  switch (slug) {
    case 'merge-pdf':
    case 'merge':
      return 'merge';
    case 'split-pdf':
    case 'split':
      return 'split';
    case 'organize-pdf':
    case 'organize':
      return 'organize';
    case 'remove-pages':
      return 'remove-pages';
    case 'extract-pages':
      return 'extract-pages';
    case 'rotate-pdf':
    case 'rotate':
      return 'rotate';
    case 'jpg-to-pdf':
    case 'png-to-pdf':
      return 'jpg-to-pdf';
    case 'pdf-to-jpg':
    case 'pdf-to-png':
      return 'pdf-to-jpg';
    case 'compress-pdf':
    case 'compress':
      return 'compress';
    case 'ocr-pdf':
    case 'ocr':
      return 'ocr';
    case 'edit-pdf':
    case 'edit':
      return 'edit';
    case 'watermark-pdf':
    case 'watermark':
      return 'watermark';
    case 'sign-pdf':
    case 'sign':
      return 'sign';
    case 'crop-pdf':
    case 'crop':
      return 'crop';
    case 'redact-pdf':
    case 'redact':
      return 'redact';
    case 'compare-pdf':
    case 'compare':
      return 'compare';
    case 'ai-pdf-summary':
    case 'pdf-summary':
      return 'ai-summary';
    case 'ai-pdf-chat':
    case 'pdf-chat':
      return 'ai-chat';
    case 'ai-study-guide':
      return 'study-guide';
    case 'ai-translate-pdf':
      return 'translate';
    default:
      return 'general';
  }
}
