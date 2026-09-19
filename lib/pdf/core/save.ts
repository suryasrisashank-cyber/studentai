import { PDFDocument } from 'pdf-lib';
import { validatePdfMagicBytes } from '../validation';

export interface SavePdfOptions {
  useObjectStreams?: boolean;
  addDefaultPage?: boolean;
}

/**
 * Serializes a PDFDocument instance to Uint8Array and verifies the output validity.
 */
export async function savePdf(
  doc: PDFDocument,
  options: SavePdfOptions = { useObjectStreams: true }
): Promise<Uint8Array> {
  const bytes = await doc.save({
    useObjectStreams: options.useObjectStreams ?? true,
    addDefaultPage: options.addDefaultPage ?? false,
  });

  // Verify resulting bytes are structurally non-empty and start with %PDF
  const check = validatePdfMagicBytes(bytes);
  if (!check.valid) {
    throw new Error('Internal serialization error: Resulting bytes are not a valid PDF.');
  }

  return bytes;
}
