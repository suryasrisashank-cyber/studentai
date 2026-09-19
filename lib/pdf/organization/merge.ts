import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Merges multiple PDF file buffers into a single PDF document in the provided sequence.
 */
export async function mergePdfs(
  buffers: (ArrayBuffer | Uint8Array)[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!buffers || buffers.length < 2) {
    throw new Error('At least two PDF documents are required to perform a merge.');
  }

  onProgress?.(10, 'Initializing merged document...');
  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < buffers.length; i++) {
    const percent = Math.round(15 + (i / buffers.length) * 75);
    onProgress?.(percent, `Merging file ${i + 1} of ${buffers.length}...`);

    const srcDoc = await loadPdf(buffers[i]);
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  onProgress?.(95, 'Finalizing merged PDF...');
  const result = await savePdf(mergedDoc);
  onProgress?.(100, 'Merge completed successfully!');
  return result;
}
