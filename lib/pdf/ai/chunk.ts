import { PDF_CONFIG } from '../config';

export interface TextChunk {
  chunkIndex: number;
  totalChunks: number;
  text: string;
}

/**
 * Cleans extracted PDF text by collapsing excess whitespace and stripping unprintable control characters.
 */
export function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/\0/g, '') // Strip null bytes
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Chunks long extracted text into manageable slices for the AI Gateway.
 */
export function chunkText(
  text: string,
  chunkSize: number = PDF_CONFIG.AI_CHUNK_SIZE,
  overlap: number = PDF_CONFIG.AI_CHUNK_OVERLAP,
  maxChunks: number = PDF_CONFIG.AI_MAX_CHUNKS
): TextChunk[] {
  const cleaned = cleanExtractedText(text);
  if (!cleaned) return [];

  // If text fits in one chunk
  if (cleaned.length <= chunkSize) {
    return [{ chunkIndex: 0, totalChunks: 1, text: cleaned }];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length && chunks.length < maxChunks) {
    let end = start + chunkSize;

    // Try not to split in the middle of a sentence
    if (end < cleaned.length) {
      const lastPeriod = cleaned.lastIndexOf('.', end);
      const lastNewline = cleaned.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize * 0.7) {
        end = breakPoint + 1;
      }
    } else {
      end = cleaned.length;
    }

    chunks.push(cleaned.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.map((c, i) => ({
    chunkIndex: i,
    totalChunks: chunks.length,
    text: c,
  }));
}
