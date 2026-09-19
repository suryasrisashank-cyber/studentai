import { renderPageToImage } from '../core/rendering';
import { ProgressCallback } from '../types';

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

export interface OcrResult {
  fullText: string;
  pages: OcrPageResult[];
  averageConfidence: number;
}

/**
 * Performs OCR on a PDF document by sequentially rendering pages to canvas
 * and running client-side Tesseract.js in a Web Worker.
 */
export async function runPdfOcr(
  pdfBytes: Uint8Array,
  pageNumbers: number[],
  language = 'eng',
  onProgress?: ProgressCallback
): Promise<OcrResult> {
  if (typeof window === 'undefined') {
    throw new Error('OCR is only available in the browser.');
  }

  if (!pageNumbers || pageNumbers.length === 0) {
    throw new Error('Please select at least one page to OCR.');
  }

  // Cap pages to preserve memory
  const pagesToProcess = pageNumbers.slice(0, 15);

  onProgress?.(5, 'Initializing OCR worker...');
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(language);

  const results: OcrPageResult[] = [];
  let totalConfidence = 0;

  try {
    for (let i = 0; i < pagesToProcess.length; i++) {
      const pageNum = pagesToProcess[i];
      const startPercent = Math.round(10 + (i / pagesToProcess.length) * 80);
      onProgress?.(startPercent, `Rendering page ${pageNum} to canvas...`);

      // 1. Render page to high-res canvas image
      const dataUrl = await renderPageToImage(pdfBytes, pageNum, 'image/jpeg', 2.0);

      onProgress?.(startPercent + 3, `Recognizing text on page ${pageNum}...`);

      // 2. Run Tesseract on the rendered image
      const ret = await worker.recognize(dataUrl);
      const text = ret.data.text.trim();
      const confidence = ret.data.confidence || 0;

      totalConfidence += confidence;
      results.push({
        pageNumber: pageNum,
        text,
        confidence,
      });
    }
  } finally {
    // Terminate worker to free WebAssembly memory
    await worker.terminate();
  }

  const fullText = results
    .map((r) => `=== Page ${r.pageNumber} (Confidence: ${Math.round(r.confidence)}%) ===\n${r.text}`)
    .join('\n\n');

  const avgConf = results.length > 0 ? Math.round(totalConfidence / results.length) : 0;
  onProgress?.(100, 'OCR completed successfully!');

  return {
    fullText,
    pages: results,
    averageConfidence: avgConf,
  };
}
