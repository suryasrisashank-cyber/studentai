import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Removes specified 0-indexed pages from a PDF and returns the updated document.
 */
export async function removePdfPages(
  buffer: ArrayBuffer | Uint8Array,
  pagesToRemove0Indexed: number[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Inspecting document pages...');
  const srcDoc = await loadPdf(buffer);
  const totalPages = srcDoc.getPageCount();

  const removeSet = new Set(pagesToRemove0Indexed);
  const remainingIndices: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    if (!removeSet.has(i)) {
      remainingIndices.push(i);
    }
  }

  if (remainingIndices.length === 0) {
    throw new Error('Cannot remove all pages. A PDF must retain at least one page.');
  }

  if (remainingIndices.length === totalPages) {
    // Nothing removed, return original
    return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  }

  onProgress?.(45, 'Creating updated document...');
  const outDoc = await PDFDocument.create();
  const copiedPages = await outDoc.copyPages(srcDoc, remainingIndices);
  for (const p of copiedPages) {
    outDoc.addPage(p);
  }

  onProgress?.(85, 'Saving sanitized PDF...');
  const result = await savePdf(outDoc);
  onProgress?.(100, 'Selected pages removed successfully!');
  return result;
}
