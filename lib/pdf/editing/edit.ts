import { StandardFonts, rgb } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { hexToRgb01 } from '../utils';
import { ProgressCallback } from '../types';

export interface EditorAnnotation {
  type: 'text' | 'draw' | 'rect' | 'highlight' | 'image';
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color?: string; // hex #RRGGBB
  opacity?: number;
  strokeWidth?: number;
  dataUrl?: string;
  points?: { x: number; y: number }[];
}

/**
 * Applies an array of interactive annotations onto the PDF document.
 */
export async function applyAnnotations(
  buffer: ArrayBuffer | Uint8Array,
  annotations: EditorAnnotation[],
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Loading PDF document...');
  const doc = await loadPdf(buffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  onProgress?.(35, 'Applying annotations...');
  for (let i = 0; i < annotations.length; i++) {
    const ann = annotations[i];
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const page = pages[ann.pageIndex];

    const color01 = ann.color ? hexToRgb01(ann.color) : { r: 0, g: 0, b: 0 };
    const pdfColor = rgb(color01.r, color01.g, color01.b);

    if (ann.type === 'text' && ann.text) {
      page.drawText(ann.text, {
        x: ann.x,
        y: ann.y,
        size: ann.fontSize || 14,
        font,
        color: pdfColor,
        opacity: ann.opacity ?? 1.0,
      });
    } else if (ann.type === 'rect' && ann.width && ann.height) {
      page.drawRectangle({
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        color: pdfColor,
        opacity: ann.opacity ?? 1.0,
      });
    } else if (ann.type === 'highlight' && ann.width && ann.height) {
      const yellow = ann.color ? pdfColor : rgb(1, 1, 0);
      page.drawRectangle({
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        color: yellow,
        opacity: ann.opacity ?? 0.35,
      });
    } else if (ann.type === 'draw' && ann.points && ann.points.length > 1) {
      // Draw path line segments
      for (let p = 0; p < ann.points.length - 1; p++) {
        const start = ann.points[p];
        const end = ann.points[p + 1];
        page.drawLine({
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          thickness: ann.strokeWidth || 2,
          color: pdfColor,
          opacity: ann.opacity ?? 1.0,
        });
      }
    } else if (ann.type === 'image' && ann.dataUrl && ann.width && ann.height) {
      const isPng = ann.dataUrl.includes('image/png');
      const base64Data = ann.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let b = 0; b < binary.length; b++) {
        bytes[b] = binary.charCodeAt(b);
      }
      const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      page.drawImage(img, {
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        opacity: ann.opacity ?? 1.0,
      });
    }
  }

  onProgress?.(85, 'Saving edited document...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Document edited successfully!');
  return result;
}
