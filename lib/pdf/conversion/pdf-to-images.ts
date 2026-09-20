import { renderPageToImage } from '../core/rendering';
import { ProgressCallback } from '../types';
import JSZip from 'jszip';

export interface RenderedImageItem {
  pageNumber: number;
  dataUrl: string;
  bytes: Uint8Array;
  filename: string;
  size: number;
}

export interface PdfToImagesResult {
  isZip: boolean;
  images: RenderedImageItem[];
  zipBytes?: Uint8Array;
  filename: string;
  totalExtracted: number;
}

export type DpiPreset = '72' | '150' | '300';

export interface PdfToImagesOptions {
  format?: 'image/jpeg' | 'image/png';
  dpi?: DpiPreset | number;
  quality?: number; // 0.1 - 1.0 (default 0.92)
  pages?: number[]; // 1-indexed page numbers
  baseFilename?: string;
  onProgress?: ProgressCallback;
}

/**
 * Resolves a DPI preset or numeric scale to a canvas scale factor.
 * Standard PDF points = 72 DPI (scale 1.0).
 * 150 DPI = 150/72 ≈ 2.08 (or standard 1.5x)
 * 300 DPI = 300/72 ≈ 4.16 (or standard 3.0x)
 */
export function resolveDpiScale(dpi?: DpiPreset | number): number {
  if (typeof dpi === 'number') return Math.max(0.5, Math.min(4.0, dpi));
  if (dpi === '300') return 3.0; // High resolution
  if (dpi === '72') return 1.0; // Fast / Web
  return 1.5; // Standard (150 DPI approx)
}

/**
 * Converts PDF pages into high-resolution JPG or PNG images and bundles
 * into a ZIP archive if multiple pages are requested.
 */
export async function convertPdfToImages(
  pdfBytes: Uint8Array,
  totalPagesOrOptions: number | PdfToImagesOptions,
  legacyFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  legacyScale = 1.5,
  legacyBaseFilename = 'document',
  legacyOnProgress?: ProgressCallback
): Promise<PdfToImagesResult> {
  // Support both new options object and legacy signature
  let format: 'image/jpeg' | 'image/png' = 'image/jpeg';
  let scale = 1.5;
  let quality = 0.92;
  let baseFilename = 'document';
  let pagesToRender: number[] = [];
  let onProgress: ProgressCallback | undefined;

  if (typeof totalPagesOrOptions === 'object') {
    const opts = totalPagesOrOptions;
    format = opts.format || 'image/jpeg';
    scale = resolveDpiScale(opts.dpi);
    quality = opts.quality !== undefined ? opts.quality : 0.92;
    baseFilename = opts.baseFilename || 'document';
    pagesToRender = opts.pages && opts.pages.length > 0 ? opts.pages : [1];
    onProgress = opts.onProgress;
  } else {
    format = legacyFormat;
    scale = legacyScale;
    baseFilename = legacyBaseFilename;
    onProgress = legacyOnProgress;
    const total = Math.min(totalPagesOrOptions, 30);
    pagesToRender = Array.from({ length: total }, (_, i) => i + 1);
  }

  // Deduplicate and filter valid 1-indexed pages
  const targetPages = Array.from(new Set(pagesToRender))
    .filter((p) => p >= 1)
    .slice(0, 50); // Safety limit for browser memory

  if (targetPages.length === 0) {
    throw new Error('Please select at least one valid page to extract.');
  }

  const ext = format === 'image/png' ? 'png' : 'jpg';
  const images: RenderedImageItem[] = [];

  onProgress?.(5, 'Initializing PDF rendering engine...');

  const total = targetPages.length;

  for (let i = 0; i < total; i++) {
    const pageNum = targetPages[i];
    const percent = Math.round(10 + ((i + 1) / total) * 75);
    onProgress?.(percent, `Rendering page ${pageNum} (${i + 1} of ${total})...`);

    const dataUrl = await renderPageToImage(pdfBytes, pageNum, format, scale, quality);

    // Convert base64 dataUrl to Uint8Array for file saving / ZIP packaging
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let b = 0; b < binary.length; b++) {
      bytes[b] = binary.charCodeAt(b);
    }

    const filename = `${baseFilename}_page_${pageNum}.${ext}`;

    images.push({
      pageNumber: pageNum,
      dataUrl,
      bytes,
      filename,
      size: bytes.byteLength,
    });
  }

  // If only 1 page extracted, return direct image without ZIP
  if (total === 1) {
    onProgress?.(100, 'Image generated successfully!');
    return {
      isZip: false,
      images,
      filename: images[0].filename,
      totalExtracted: 1,
    };
  }

  // Multi-page: Bundle into JSZip
  onProgress?.(88, 'Packaging extracted images into ZIP archive...');
  const zip = new JSZip();

  for (const img of images) {
    zip.file(img.filename, img.bytes);
  }

  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  onProgress?.(100, `Successfully extracted ${total} images!`);

  return {
    isZip: true,
    images,
    zipBytes,
    filename: `${baseFilename}_images.zip`,
    totalExtracted: total,
  };
}
