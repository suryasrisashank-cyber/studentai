import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Attempts structural recovery of corrupted or damaged PDF documents.
 */
export async function repairPdf(
  buffer: ArrayBuffer | Uint8Array,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Scanning damaged PDF structure...');
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  try {
    onProgress?.(40, 'Rebuilding document catalog and object references...');
    const srcDoc = await loadPdf(bytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('No salvageable pages found in the corrupted document.');
    }

    const rebuiltDoc = await PDFDocument.create();
    const copiedPages = await rebuiltDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      rebuiltDoc.addPage(page);
    }

    onProgress?.(80, 'Reconstructing xref table and trailers...');
    const result = await savePdf(rebuiltDoc);
    onProgress?.(100, 'Document repaired successfully!');
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `PDF Repair was unable to recover this document. Reason: ${msg}. (Severe byte corruption or truncated files cannot be restored).`
    );
  }
}
