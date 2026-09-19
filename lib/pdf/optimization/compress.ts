import { PDFDocument } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { CompressionResult, ProgressCallback } from '../types';

export type CompressionLevel = 'low' | 'balanced' | 'strong';

/**
 * Optimizes PDF streams and object dictionaries, measuring exact before/after byte savings.
 */
export async function compressPdf(
  buffer: ArrayBuffer | Uint8Array,
  level: CompressionLevel = 'balanced',
  onProgress?: ProgressCallback
): Promise<CompressionResult> {
  const originalBytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const originalSize = originalBytes.length;

  onProgress?.(15, 'Analyzing PDF streams...');
  const srcDoc = await loadPdf(originalBytes);

  onProgress?.(45, 'Re-encoding object dictionaries...');
  // Create a clean new document to purge unused objects and rebuild xref
  const cleanDoc = await PDFDocument.create();
  const pageIndices = srcDoc.getPageIndices();
  const copiedPages = await cleanDoc.copyPages(srcDoc, pageIndices);

  for (const page of copiedPages) {
    cleanDoc.addPage(page);
  }

  // Set standard creator tag
  cleanDoc.setCreator('StudentAI PDF Engine');
  cleanDoc.setProducer('StudentAI Optimization Pipeline');

  onProgress?.(80, 'Compressing output streams...');
  const compressedBytes = await savePdf(cleanDoc, {
    useObjectStreams: true,
  });

  const compressedSize = compressedBytes.length;
  const savedBytes = originalSize - compressedSize;
  const savedPercentage = Math.round((savedBytes / originalSize) * 1000) / 10;
  const isSmaller = savedBytes > 0;

  onProgress?.(100, isSmaller ? 'Compression completed!' : 'Optimization complete (document already compact).');

  return {
    bytes: isSmaller ? compressedBytes : originalBytes,
    originalSize,
    compressedSize: isSmaller ? compressedSize : originalSize,
    savedBytes: isSmaller ? savedBytes : 0,
    savedPercentage: isSmaller ? savedPercentage : 0,
    isSmaller,
  };
}
