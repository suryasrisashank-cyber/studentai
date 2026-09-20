import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { validatePdfMagicBytes } from '../validation';
import { ProgressCallback } from '../types';

/**
 * Merges multiple PDF file buffers into a single PDF document in the provided sequence.
 * Supports merging two or more PDFs, or consolidating a single PDF.
 */
export async function mergePdfs(
  buffers: (ArrayBuffer | Uint8Array)[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!buffers || buffers.length === 0) {
    throw new Error('At least one PDF document is required to perform a merge.');
  }

  onProgress?.(10, 'Initializing merged document...');
  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < buffers.length; i++) {
    const percent = Math.round(15 + ((i + 1) / buffers.length) * 75);
    onProgress?.(percent, `Merging document ${i + 1} of ${buffers.length}...`);

    const srcDoc = await loadPdf(buffers[i]);
    const pageIndices = srcDoc.getPageIndices();
    if (pageIndices.length > 0) {
      const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    }
  }

  if (mergedDoc.getPageCount() === 0) {
    throw new Error('The selected PDF documents contain no pages to merge.');
  }

  onProgress?.(95, 'Finalizing merged PDF...');
  const result = await savePdf(mergedDoc);

  // Validate output integrity
  const check = validatePdfMagicBytes(result);
  if (!check.valid) {
    throw new Error('Merged document output validation failed.');
  }

  onProgress?.(100, 'Merge completed successfully!');
  return result;
}
