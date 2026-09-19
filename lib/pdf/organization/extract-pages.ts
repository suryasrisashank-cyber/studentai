import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Extracts specific 0-indexed pages into a new PDF document.
 */
export async function extractPdfPages(
  buffer: ArrayBuffer | Uint8Array,
  pagesToExtract0Indexed: number[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!pagesToExtract0Indexed || pagesToExtract0Indexed.length === 0) {
    throw new Error('Please select at least one page to extract.');
  }

  onProgress?.(15, 'Loading source document...');
  const srcDoc = await loadPdf(buffer);
  const totalPages = srcDoc.getPageCount();

  // Validate indices
  for (const idx of pagesToExtract0Indexed) {
    if (idx < 0 || idx >= totalPages) {
      throw new Error(`Page index ${idx + 1} is out of bounds (1-${totalPages})`);
    }
  }

  onProgress?.(45, 'Extracting selected pages...');
  const outDoc = await PDFDocument.create();
  const copiedPages = await outDoc.copyPages(srcDoc, pagesToExtract0Indexed);
  for (const page of copiedPages) {
    outDoc.addPage(page);
  }

  onProgress?.(85, 'Saving extracted PDF...');
  const result = await savePdf(outDoc);
  onProgress?.(100, 'Extraction complete!');
  return result;
}
