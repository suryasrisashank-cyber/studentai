import { PDFDocument, degrees } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

export interface PageOrderConfig {
  sourcePageIndex: number; // 0-indexed
  rotationAngle?: number; // 0, 90, 180, 270
}

/**
 * Reorganizes a PDF document by reordering, duplicating, or applying rotation to pages.
 */
export async function organizePdf(
  buffer: ArrayBuffer | Uint8Array,
  pageConfigs: PageOrderConfig[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!pageConfigs || pageConfigs.length === 0) {
    throw new Error('At least one page configuration must be provided.');
  }

  onProgress?.(15, 'Loading source document...');
  const srcDoc = await loadPdf(buffer);
  const totalPages = srcDoc.getPageCount();

  onProgress?.(30, 'Reordering pages...');
  const outDoc = await PDFDocument.create();

  // Validate all indices
  for (const cfg of pageConfigs) {
    if (cfg.sourcePageIndex < 0 || cfg.sourcePageIndex >= totalPages) {
      throw new Error(`Invalid source page index: ${cfg.sourcePageIndex + 1}`);
    }
  }

  const sourceIndices = pageConfigs.map((c) => c.sourcePageIndex);
  const copiedPages = await outDoc.copyPages(srcDoc, sourceIndices);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    const cfg = pageConfigs[i];
    if (cfg.rotationAngle && cfg.rotationAngle % 90 === 0) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + cfg.rotationAngle) % 360));
    }
    outDoc.addPage(page);
  }

  onProgress?.(85, 'Saving organized document...');
  const result = await savePdf(outDoc);
  onProgress?.(100, 'Organize complete!');
  return result;
}
