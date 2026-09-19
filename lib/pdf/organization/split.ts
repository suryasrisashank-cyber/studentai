import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { parsePageRanges } from '../utils';
import { ProgressCallback } from '../types';
import JSZip from 'jszip';

export interface SplitResult {
  isZip: boolean;
  bytes: Uint8Array;
  filename: string;
  pageCount: number;
}

/**
 * Splits a PDF document either by specific page ranges or into individual single-page files.
 */
export async function splitPdf(
  buffer: ArrayBuffer | Uint8Array,
  rangeStr: string,
  baseFilename = 'document',
  onProgress?: ProgressCallback
): Promise<SplitResult> {
  onProgress?.(15, 'Reading PDF pages...');
  const srcDoc = await loadPdf(buffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The uploaded PDF contains no pages.');
  }

  // Parse page ranges (0-indexed)
  const targetIndices = parsePageRanges(rangeStr, totalPages);
  if (targetIndices.length === 0) {
    throw new Error(`Invalid page range. Document has ${totalPages} pages. Example range: 1-3, 5`);
  }

  // If user selected all individual pages separately or multiple separate output files
  if (rangeStr.trim().toLowerCase() === 'all' || targetIndices.length > 10) {
    onProgress?.(30, 'Generating individual page PDFs...');
    const zip = new JSZip();

    for (let i = 0; i < targetIndices.length; i++) {
      const pageIndex = targetIndices[i];
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcDoc, [pageIndex]);
      singleDoc.addPage(copied);
      const pageBytes = await savePdf(singleDoc);
      zip.file(`${baseFilename}_page_${pageIndex + 1}.pdf`, pageBytes);

      const percent = Math.round(30 + ((i + 1) / targetIndices.length) * 55);
      onProgress?.(percent, `Packaging page ${pageIndex + 1}...`);
    }

    onProgress?.(90, 'Compressing into ZIP archive...');
    const zipBytes = await zip.generateAsync({ type: 'uint8array' });
    onProgress?.(100, 'Split completed!');

    return {
      isZip: true,
      bytes: zipBytes,
      filename: `${baseFilename}_split_pages.zip`,
      pageCount: targetIndices.length,
    };
  }

  // Single PDF output with selected pages
  onProgress?.(40, 'Extracting selected pages into new PDF...');
  const outDoc = await PDFDocument.create();
  const copiedPages = await outDoc.copyPages(srcDoc, targetIndices);
  for (const p of copiedPages) {
    outDoc.addPage(p);
  }

  onProgress?.(85, 'Saving output PDF...');
  const resultBytes = await savePdf(outDoc);
  onProgress?.(100, 'Split completed!');

  return {
    isZip: false,
    bytes: resultBytes,
    filename: `${baseFilename}_extracted.pdf`,
    pageCount: targetIndices.length,
  };
}
