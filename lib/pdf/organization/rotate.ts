import { degrees } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Rotates all or selected pages in a PDF document by 90, 180, or 270 degrees.
 */
export async function rotatePdf(
  buffer: ArrayBuffer | Uint8Array,
  rotationAngle: number,
  targetPages0Indexed?: number[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (rotationAngle % 90 !== 0) {
    throw new Error('Rotation angle must be a multiple of 90 degrees (e.g. 90, 180, 270).');
  }

  onProgress?.(20, 'Loading document...');
  const doc = await loadPdf(buffer);
  const pages = doc.getPages();
  const targetSet = targetPages0Indexed ? new Set(targetPages0Indexed) : null;

  onProgress?.(50, 'Applying rotation...');
  pages.forEach((page, index) => {
    if (!targetSet || targetSet.has(index)) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rotationAngle) % 360));
    }
  });

  onProgress?.(85, 'Saving rotated document...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Rotation completed!');
  return result;
}
