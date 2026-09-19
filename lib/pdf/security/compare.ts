import { extractAllPdfText } from '../core/rendering';
import { ProgressCallback } from '../types';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface PdfComparisonResult {
  pageCountA: number;
  pageCountB: number;
  totalWordsA: number;
  totalWordsB: number;
  addedLinesCount: number;
  removedLinesCount: number;
  diffLines: DiffLine[];
}

/**
 * Compares two PDF documents side-by-side and returns structural and textual differences.
 */
export async function comparePdfs(
  pdfBytesA: Uint8Array,
  pdfBytesB: Uint8Array,
  onProgress?: ProgressCallback
): Promise<PdfComparisonResult> {
  onProgress?.(20, 'Extracting text from Document A...');
  const resA = await extractAllPdfText(pdfBytesA, 50);

  onProgress?.(50, 'Extracting text from Document B...');
  const resB = await extractAllPdfText(pdfBytesB, 50);

  onProgress?.(80, 'Analyzing text differences...');
  const linesA = resA.text.split('\n').map((l) => l.trim()).filter(Boolean);
  const linesB = resB.text.split('\n').map((l) => l.trim()).filter(Boolean);

  const setA = new Set(linesA);
  const setB = new Set(linesB);

  const diffLines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;

  // Find removed lines (in A but not in B)
  linesA.forEach((line) => {
    if (!setB.has(line)) {
      diffLines.push({ type: 'removed', text: line });
      removedCount++;
    }
  });

  // Find added lines (in B but not in A)
  linesB.forEach((line) => {
    if (!setA.has(line)) {
      diffLines.push({ type: 'added', text: line });
      addedCount++;
    } else {
      diffLines.push({ type: 'unchanged', text: line });
    }
  });

  const wordsA = resA.text.split(/\s+/).filter(Boolean).length;
  const wordsB = resB.text.split(/\s+/).filter(Boolean).length;

  onProgress?.(100, 'Comparison complete!');

  return {
    pageCountA: resA.pageCount,
    pageCountB: resB.pageCount,
    totalWordsA: wordsA,
    totalWordsB: wordsB,
    addedLinesCount: addedCount,
    removedLinesCount: removedCount,
    diffLines: diffLines.slice(0, 200), // Cap diff display for performance
  };
}
