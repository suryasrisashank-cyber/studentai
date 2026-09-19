/**
 * Browser-only PDF rendering and rasterization utility using pdfjs-dist.
 */

let pdfjsLibInstance: any = null;

async function getPdfjs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF rendering to canvas is only available in the browser.');
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

/**
 * Renders a specific 1-indexed page of a PDF onto an HTML5 Canvas.
 */
export async function renderPageToCanvas(
  pdfBytes: Uint8Array,
  pageNumber: number,
  scale = 1.5
): Promise<HTMLCanvasElement> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;

  if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
    throw new Error(`Page ${pageNumber} out of bounds (1-${pdfDoc.numPages})`);
  }

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create HTML5 2D Canvas context.');
  }

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  await page.render(renderContext).promise;
  return canvas;
}

/**
 * Renders a 1-indexed page and returns a data URL (image/png or image/jpeg).
 */
export async function renderPageToImage(
  pdfBytes: Uint8Array,
  pageNumber: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  scale = 1.5,
  quality = 0.92
): Promise<string> {
  const canvas = await renderPageToCanvas(pdfBytes, pageNumber, scale);
  const dataUrl = canvas.toDataURL(format, quality);
  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}

/**
 * Extracts plain text from a specific 1-indexed page using pdfjs-dist.
 */
export async function extractTextFromPage(
  pdfBytes: Uint8Array,
  pageNumber: number
): Promise<string> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;

  if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
    return '';
  }

  const page = await pdfDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const strings = textContent.items.map((item: any) => item.str || '');
  return strings.join(' ');
}

/**
 * Extracts all text across the PDF up to maxPages.
 */
export async function extractAllPdfText(
  pdfBytes: Uint8Array,
  maxPages = 50
): Promise<{ text: string; pageCount: number }> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;

  const numPages = Math.min(pdfDoc.numPages, maxPages);
  const chunks: string[] = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str || '');
    chunks.push(`--- Page ${p} ---\n` + strings.join(' '));
  }

  return {
    text: chunks.join('\n\n'),
    pageCount: pdfDoc.numPages,
  };
}
