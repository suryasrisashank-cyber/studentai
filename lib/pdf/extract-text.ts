/**
 * Client-side document text extraction utility for StudentAI.
 * Supports PDF (via pdfjs-dist), TXT, Markdown, and source code files.
 * Formats pages with [page N] markers for grounded document AI.
 */

let pdfjsLibInstance: any = null;

async function getPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in the browser.');
  }

  if (!pdfjsLibInstance) {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
    pdfjsLibInstance = pdfjs;
  }

  return pdfjsLibInstance;
}

export interface ExtractedDocument {
  name: string;
  size: number;
  totalPages: number;
  text: string;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<ExtractedDocument> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    onProgress?.('Reading text file…');
    const text = await file.text();
    return {
      name: file.name,
      size: file.size,
      totalPages: 1,
      text: `[page 1]\n${text.trim()}`,
    };
  }

  onProgress?.('Loading PDF engine…');
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.('Parsing PDF document structure…');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const doc = await loadingTask.promise;

  const totalPages = doc.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`Extracting page ${i} of ${totalPages}…`);
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const str = content.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (str) {
      pageTexts.push(`[page ${i}]\n${str}`);
    }
  }

  const combined = pageTexts.join('\n\n').trim();
  if (!combined) {
    throw new Error(
      'This PDF has no selectable text layer (it may be a scanned image). Please use an OCR tool or upload a digital PDF.'
    );
  }

  return {
    name: file.name,
    size: file.size,
    totalPages,
    text: combined,
  };
}
