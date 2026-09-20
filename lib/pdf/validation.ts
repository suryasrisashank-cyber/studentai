import { PDF_CONFIG } from './config';
import { PdfErrorCode } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: PdfErrorCode;
}

/**
 * Validates whether an ArrayBuffer or Uint8Array begins with the valid PDF magic bytes '%PDF'.
 */
export function validatePdfMagicBytes(buffer: ArrayBuffer | Uint8Array): ValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 5) {
    return {
      valid: false,
      error: 'File is too small to be a valid PDF document.',
      code: 'INVALID_FILE',
    };
  }

  // Check for %PDF- (hex: 25 50 44 46) anywhere within the first 1024 bytes (in case of leading comments/bom)
  const headerSearchLimit = Math.min(bytes.length, 1024);
  let found = false;
  for (let i = 0; i < headerSearchLimit - 4; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 // F
    ) {
      found = true;
      break;
    }
  }

  if (!found) {
    return {
      valid: false,
      error: 'Invalid document: Missing standard PDF header (%PDF).',
      code: 'INVALID_FILE',
    };
  }

  return { valid: true };
}

/**
 * Validates file size against configured or specified limit.
 */
export function validateFileSize(
  sizeInBytes: number,
  maxMB: number = PDF_CONFIG.MAX_FILE_SIZE_MB
): ValidationResult {
  const maxBytes = maxMB * 1024 * 1024;
  if (sizeInBytes <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).', code: 'INVALID_FILE' };
  }
  if (sizeInBytes > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the allowed limit of ${maxMB} MB (selected: ${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB).`,
      code: 'FILE_TOO_LARGE',
    };
  }
  return { valid: true };
}

/**
 * Validates file count against maximum limit.
 */
export function validateFileCount(count: number, maxCount = 50): ValidationResult {
  if (count <= 0) {
    return { valid: false, error: 'Please provide at least one file.', code: 'INVALID_FILE' };
  }
  if (count > maxCount) {
    return {
      valid: false,
      error: `Maximum file limit exceeded. You can upload up to ${maxCount} files at once.`,
      code: 'UNSUPPORTED_OPERATION',
    };
  }
  return { valid: true };
}

/**
 * Validates a PDF file (extension, MIME, size, and optional magic bytes).
 */
export function validatePdfFile(file: {
  name: string;
  size: number;
  type?: string;
  buffer?: ArrayBuffer | Uint8Array;
}): ValidationResult {
  const sizeCheck = validateFileSize(file.size);
  if (!sizeCheck.valid) return sizeCheck;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf') {
    return {
      valid: false,
      error: 'Only PDF documents (.pdf) are supported.',
      code: 'UNSUPPORTED_FORMAT',
    };
  }

  if (file.type && file.type !== 'application/pdf' && file.type !== 'application/x-pdf') {
    return {
      valid: false,
      error: 'File MIME type does not match PDF specification.',
      code: 'UNSUPPORTED_FORMAT',
    };
  }

  if (file.buffer) {
    const magicCheck = validatePdfMagicBytes(file.buffer);
    if (!magicCheck.valid) return magicCheck;
  }

  return { valid: true };
}

/**
 * Validates an image file (extension, MIME, size, and magic bytes).
 */
export function validateImageFile(file: {
  name: string;
  size: number;
  type?: string;
  buffer?: ArrayBuffer | Uint8Array;
}): ValidationResult {
  const sizeCheck = validateFileSize(file.size);
  if (!sizeCheck.valid) return sizeCheck;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported image format (.${ext || 'unknown'}). Supported: JPG, PNG, WebP, BMP.`,
      code: 'UNSUPPORTED_FORMAT',
    };
  }

  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/x-ms-bmp',
  ];
  if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image MIME type (${file.type}).`,
      code: 'UNSUPPORTED_FORMAT',
    };
  }

  if (file.buffer) {
    const bytes = file.buffer instanceof Uint8Array ? file.buffer : new Uint8Array(file.buffer);
    if (bytes.length < 4) {
      return { valid: false, error: 'Corrupted image file: File too small.', code: 'INVALID_FILE' };
    }

    // Check Magic Bytes:
    // JPEG: FF D8 FF
    // PNG: 89 50 4E 47
    // WebP: RIFF ... WEBP
    // BMP: 42 4D (BM)
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isBmp = bytes[0] === 0x42 && bytes[1] === 0x4d;
    const isWebp =
      bytes.length >= 12 &&
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50; // P

    if (!isJpeg && !isPng && !isBmp && !isWebp) {
      return {
        valid: false,
        error: 'File signature does not match a valid image format.',
        code: 'INVALID_FILE',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an Office document file (.docx, .pptx, .xlsx).
 */
export function validateOfficeFile(
  file: {
    name: string;
    size: number;
    type?: string;
  },
  expectedType: 'docx' | 'pptx' | 'xlsx'
): ValidationResult {
  const sizeCheck = validateFileSize(file.size);
  if (!sizeCheck.valid) return sizeCheck;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== expectedType) {
    return {
      valid: false,
      error: `Expected a .${expectedType} document, but received .${ext || 'unknown'}.`,
      code: 'UNSUPPORTED_FORMAT',
    };
  }

  return { valid: true };
}

/**
 * Sanitizes an uploaded filename to prevent directory traversal or unsafe characters.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, '');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 120);
}
