import { PDF_CONFIG } from './config';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates whether an ArrayBuffer or Uint8Array begins with the valid PDF magic bytes '%PDF'.
 */
export function validatePdfMagicBytes(buffer: ArrayBuffer | Uint8Array): ValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 5) {
    return { valid: false, error: 'File is too small to be a valid PDF document.' };
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
    return { valid: false, error: 'Invalid document: Missing standard PDF header (%PDF).' };
  }

  return { valid: true };
}

/**
 * Validates file size against configured limit.
 */
export function validateFileSize(sizeInBytes: number, maxMB: number = PDF_CONFIG.MAX_FILE_SIZE_MB): ValidationResult {
  const maxBytes = maxMB * 1024 * 1024;
  if (sizeInBytes <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }
  if (sizeInBytes > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the allowed limit of ${maxMB} MB (selected: ${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB).`,
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
