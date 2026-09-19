import { PDFDocument } from 'pdf-lib';
import { validatePdfMagicBytes } from '../validation';

export interface LoadPdfOptions {
  ignoreEncryption?: boolean;
  updateMetadata?: boolean;
  password?: string;
}

/**
 * Loads a PDF buffer into a pdf-lib PDFDocument instance with robust validation.
 */
export async function loadPdf(
  buffer: ArrayBuffer | Uint8Array,
  options: LoadPdfOptions = {}
): Promise<PDFDocument> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. Verify magic bytes
  const magicCheck = validatePdfMagicBytes(bytes);
  if (!magicCheck.valid) {
    throw new Error(magicCheck.error || 'Invalid PDF document');
  }

  // 2. Attempt pdf-lib load
  try {
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: options.ignoreEncryption ?? false,
      updateMetadata: options.updateMetadata ?? false,
    });
    return doc;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new Error('This document is password protected. Please unlock it first.');
    }
    throw new Error(`Failed to parse PDF document: ${msg}`);
  }
}
