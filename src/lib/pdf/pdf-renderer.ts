/**
 * Browser-side PDF Renderer using Mozilla's PDF.js
 * Handles page rendering, thumbnail generation, and text extraction purely client-side.
 */

let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

export async function getPdfJs() {
  if (typeof window === 'undefined') {
    return import('pdfjs-dist/legacy/build/pdf.mjs');
  }

  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((pdfjs) => {
      // Configure local worker to prevent CDN dependencies and external network requests
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }
      return pdfjs;
    });
  }

  return pdfjsLibPromise;
}

/**
 * Loads a PDF document using PDF.js
 */
export async function getPdfDocument(data: ArrayBuffer | Uint8Array) {
  const pdfjs = await getPdfJs();
  // Always copy buffer to prevent PDF.js Web Worker transfer from detaching caller's ArrayBuffer
  const bytes =
    data instanceof Uint8Array
      ? new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))
      : new Uint8Array(data.slice(0));
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;
  const originalCleanup = doc.cleanup ? doc.cleanup.bind(doc) : async () => {};
  doc.cleanup = async () => {
    try {
      await originalCleanup();
    } finally {
      await loadingTask.destroy();
    }
  };
  return doc;
}

/**
 * Retrieves the total page count of a PDF file
 */
export async function getPdfPageCount(file: File | ArrayBuffer): Promise<number> {
  const pdfjs = await getPdfJs();
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const bytes = new Uint8Array(data.slice(0));
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  await doc.cleanup();
  await loadingTask.destroy();
  return numPages;
}

/**
 * Renders a specific page of a PDF file to a Data URL or Canvas
 */
export async function renderPdfPageToDataUrl(
  file: File | ArrayBuffer,
  pageNumber: number,
  scale = 0.5
): Promise<string> {
  const pdfjs = await getPdfJs();
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;

  try {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');

    // Render page
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Cleanup canvas
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}

/**
 * Extracts plain text from all pages of a PDF document
 */
export async function extractTextFromPdf(
  file: File | ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const pdfjs = await getPdfJs();
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;

  try {
    const textPieces: string[] = [];
    const total = doc.numPages;

    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => (item && 'str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ');

      textPieces.push(`--- Page ${i} ---\n` + pageText.trim());
      if (onProgress) {
        onProgress(i, total);
      }
    }

    return textPieces.join('\n\n');
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}
