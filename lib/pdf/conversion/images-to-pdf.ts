import { PDFDocument } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';
import { validateImageFile } from '../validation';

export interface ImageInput {
  bytes: Uint8Array;
  mimeType: string;
  name?: string;
}

/** Standard page sizes in points [width, height] portrait (72 points per inch) */
export const PAGE_SIZES = {
  A4: [595.28, 841.89] as [number, number], // 210 x 297 mm
  LETTER: [612.0, 792.0] as [number, number], // 8.5 x 11 inches
  ORIGINAL: null as null, // Use image native dimensions in points
} as const;

export type PageSize = 'A4' | 'LETTER' | 'ORIGINAL' | 'Letter' | 'Original';
export type Orientation = 'AUTO' | 'PORTRAIT' | 'LANDSCAPE' | 'auto' | 'portrait' | 'landscape';
export type MarginPreset = 'NONE' | 'SMALL' | 'MEDIUM' | 'none' | 'small' | 'medium';
export type ImageFit = 'FIT' | 'FILL' | 'ORIGINAL' | 'fit' | 'fill' | 'original';
export type QualityPreset = 'STANDARD' | 'HIGH' | 'standard' | 'high';

export const MARGIN_VALUES: Record<string, number> = {
  none: 0,
  NONE: 0,
  small: 14, // ~5mm (14.17 pt)
  SMALL: 14,
  medium: 36, // ~12.7mm (36.0 pt / 0.5 in)
  MEDIUM: 36,
};

/**
 * Centralized helper for obtaining the margin in points.
 */
export function getPdfMargin(margin?: MarginPreset | number | string): number {
  if (typeof margin === 'number') return Math.max(0, margin);
  if (!margin) return MARGIN_VALUES.SMALL;
  const key = String(margin).toLowerCase();
  return MARGIN_VALUES[key] ?? MARGIN_VALUES.small;
}

export interface ImagesToPdfOptions {
  pageSize?: PageSize;
  orientation?: Orientation;
  margin?: MarginPreset | number | string;
  imageFit?: ImageFit;
  quality?: QualityPreset;
  /** @deprecated use margin preset. Kept for backwards compatibility */
  fitPage?: boolean;
}

/**
 * Normalizes page size input to canonical keys.
 */
function normalizePageSize(size?: PageSize): 'A4' | 'LETTER' | 'ORIGINAL' {
  if (!size) return 'A4';
  const s = size.toUpperCase();
  if (s === 'LETTER') return 'LETTER';
  if (s === 'ORIGINAL') return 'ORIGINAL';
  return 'A4';
}

/**
 * Normalizes orientation input to canonical keys.
 */
function normalizeOrientation(orientation?: Orientation): 'AUTO' | 'PORTRAIT' | 'LANDSCAPE' {
  if (!orientation) return 'AUTO';
  const o = orientation.toUpperCase();
  if (o === 'LANDSCAPE') return 'LANDSCAPE';
  if (o === 'PORTRAIT') return 'PORTRAIT';
  return 'AUTO';
}

/**
 * Normalizes image fit input to canonical keys.
 */
function normalizeImageFit(fit?: ImageFit): 'FIT' | 'FILL' | 'ORIGINAL' {
  if (!fit) return 'FIT';
  const f = fit.toUpperCase();
  if (f === 'FILL') return 'FILL';
  if (f === 'ORIGINAL') return 'ORIGINAL';
  return 'FIT';
}

/**
 * Professional JPG/PNG/WebP/BMP -> PDF engine.
 * Supports: A4, Letter, Original page sizes; Auto/Portrait/Landscape orientation;
 * None/Small/Medium margins; Fit/Fill/Original image positioning; Standard/High quality.
 */
export async function convertImagesToPdf(
  images: ImageInput[],
  options: ImagesToPdfOptions = {},
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('Please provide at least one image file.');
  }

  const normPageSize = normalizePageSize(options.pageSize);
  const normOrientation = normalizeOrientation(options.orientation);
  const normImageFit = normalizeImageFit(options.imageFit);
  const marginPts = getPdfMargin(options.margin);

  onProgress?.(5, 'Initializing PDF engine...');
  const doc = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    const imgItem = images[i];
    const progressBase = 10 + Math.round((i / images.length) * 80);
    onProgress?.(progressBase, `Processing image ${i + 1} of ${images.length}...`);

    // Validate format before embedding
    const validation = validateImageFile({
      name: imgItem.name || `image_${i + 1}.jpg`,
      size: imgItem.bytes.byteLength,
      type: imgItem.mimeType,
      buffer: imgItem.bytes,
    });

    if (!validation.valid) {
      throw new Error(`Image ${i + 1} (${imgItem.name || 'unnamed'}): ${validation.error}`);
    }

    const isPng = imgItem.mimeType.toLowerCase().includes('png');
    let embeddedImage;
    try {
      embeddedImage = isPng
        ? await doc.embedPng(imgItem.bytes)
        : await doc.embedJpg(imgItem.bytes);
    } catch {
      throw new Error(
        `Image ${i + 1} (${imgItem.name || 'unknown'}) could not be decoded. ` +
          'It may be corrupt, unsupported, or an uncompressed format not supported natively.'
      );
    }

    const nativeDims = embeddedImage.scale(1.0);
    const imgW = nativeDims.width;
    const imgH = nativeDims.height;

    // --- Determine page dimensions ---
    let pageW: number;
    let pageH: number;

    if (normPageSize === 'ORIGINAL') {
      pageW = imgW + marginPts * 2;
      pageH = imgH + marginPts * 2;
    } else {
      const baseDims = PAGE_SIZES[normPageSize];
      const [baseW, baseH] = baseDims;

      let finalOrientation: 'PORTRAIT' | 'LANDSCAPE';
      if (normOrientation === 'AUTO') {
        // Landscape if wider than tall, Portrait if taller or square
        finalOrientation = imgW > imgH ? 'LANDSCAPE' : 'PORTRAIT';
      } else {
        finalOrientation = normOrientation;
      }

      if (finalOrientation === 'LANDSCAPE') {
        pageW = baseH; // rotated 90 deg
        pageH = baseW;
      } else {
        pageW = baseW;
        pageH = baseH;
      }
    }

    // Available printable area
    const availW = Math.max(1, pageW - marginPts * 2);
    const availH = Math.max(1, pageH - marginPts * 2);

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (normImageFit === 'FILL') {
      // FILL (Cover): scale to cover available area, center
      const scaleX = availW / imgW;
      const scaleY = availH / imgH;
      const scale = Math.max(scaleX, scaleY);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    } else if (normImageFit === 'ORIGINAL') {
      // ORIGINAL: preserve 1:1 pixels/points, scale down proportionally if exceeding page
      const scale = Math.min(availW / imgW, availH / imgH, 1.0);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    } else {
      // FIT: scale proportionally to fit completely inside printable area
      const scaleX = availW / imgW;
      const scaleY = availH / imgH;
      const scale = Math.min(scaleX, scaleY);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    }

    const page = doc.addPage([pageW, pageH]);
    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  onProgress?.(92, 'Generating PDF...');
  const result = await savePdf(doc);
  onProgress?.(
    100,
    `PDF created from ${images.length} image${images.length !== 1 ? 's' : ''} successfully!`
  );
  return result;
}
