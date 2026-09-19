import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { CropMargins, ProgressCallback } from '../types';

/**
 * Crops margins from PDF pages by adjusting the CropBox dimensions.
 */
export async function cropPdf(
  buffer: ArrayBuffer | Uint8Array,
  margins: CropMargins,
  targetPages0Indexed?: number[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Loading PDF document...');
  const doc = await loadPdf(buffer);
  const pages = doc.getPages();
  const targetSet = targetPages0Indexed ? new Set(targetPages0Indexed) : null;

  onProgress?.(45, 'Applying crop margins...');
  pages.forEach((page, index) => {
    if (!targetSet || targetSet.has(index)) {
      const { width, height } = page.getSize();

      const newX = Math.max(0, margins.left);
      const newY = Math.max(0, margins.bottom);
      const newWidth = Math.max(50, width - margins.left - margins.right);
      const newHeight = Math.max(50, height - margins.top - margins.bottom);

      if (newWidth > 0 && newHeight > 0) {
        page.setCropBox(newX, newY, newWidth, newHeight);
      }
    }
  });

  onProgress?.(85, 'Saving cropped document...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Crop completed!');
  return result;
}
