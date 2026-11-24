import { PDFDocument, EncryptedPDFError } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';

export const ENCRYPTED_PDF_ERROR_MESSAGE =
  'This PDF is encrypted or password-protected and cannot be processed. Please unlock or remove the password before uploading.';

export function isEncryptedPdfError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return typeof err === 'string' && /encrypted|password/i.test(err);
  }
  if (err instanceof EncryptedPDFError) {
    return true;
  }
  const anyErr = err as { name?: string; message?: string };
  if (anyErr.name === 'EncryptedPDFError' || anyErr.name === 'PasswordException') {
    return true;
  }
  return typeof anyErr.message === 'string' && /encrypted|password/i.test(anyErr.message);
}

/**
 * Load a PDF with pdf-lib and reject encrypted/password-protected documents cleanly.
 */
export async function loadUnencryptedPdf(
  buffer: ArrayBuffer,
  options: { updateMetadata?: boolean } = {}
): Promise<PDFDocument> {
  try {
    const doc = await PDFDocument.load(buffer, {
      updateMetadata: options.updateMetadata,
    });
    const hasTrailerEncrypt = Boolean((doc as any).context?.trailerInfo?.Encrypt);
    if (doc.isEncrypted || hasTrailerEncrypt) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }
    return doc;
  } catch (err) {
    if (isEncryptedPdfError(err)) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }
    throw err;
  }
}

/**
 * Verify a PDF buffer is not encrypted (user- or owner-encrypted) via pdf-lib inspection.
 */
export async function assertUnencryptedPdfBuffer(buffer: ArrayBuffer): Promise<void> {
  try {
    await loadUnencryptedPdf(buffer, { updateMetadata: false });
  } catch (err) {
    if (err instanceof Error && err.message === ENCRYPTED_PDF_ERROR_MESSAGE) {
      throw err;
    }
    if (isEncryptedPdfError(err)) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }
    // Non-encryption pdf-lib parse quirks are checked further by PDF.js below.
  }
}

/**
 * Open a PDF with PDF.js while rejecting both user-password and owner-encrypted documents,
 * and return a cleanup callback that releases worker/document resources.
 */
export async function openUnencryptedPdfJsDocument(
  buffer: ArrayBuffer
): Promise<{ doc: any; cleanup: () => Promise<void> }> {
  await assertUnencryptedPdfBuffer(buffer);

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  let doc: any;
  try {
    doc = await loadingTask.promise;
    const [permissions, metadata] = await Promise.all([
      typeof doc.getPermissions === 'function' ? doc.getPermissions().catch(() => null) : Promise.resolve(null),
      typeof doc.getMetadata === 'function' ? doc.getMetadata().catch(() => null) : Promise.resolve(null),
    ]);

    const encryptFilterName = (metadata?.info as { EncryptFilterName?: string | null } | undefined)?.EncryptFilterName;
    if (permissions !== null || Boolean(encryptFilterName)) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }

    return {
      doc,
      cleanup: async () => {
        try {
          await doc.cleanup?.();
        } finally {
          await loadingTask.destroy?.();
        }
      },
    };
  } catch (err) {
    try {
      await doc?.cleanup?.();
    } catch {
      // Ignore cleanup errors during rejection
    }
    try {
      await loadingTask.destroy?.();
    } catch {
      // Ignore destroy errors during rejection
    }
    if (err instanceof Error && err.message === ENCRYPTED_PDF_ERROR_MESSAGE) {
      throw err;
    }
    if (isEncryptedPdfError(err)) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }
    throw err;
  }
}

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Read File as ArrayBuffer safely with Promise
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (file && typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available in this environment'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read File as Data URL safely
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Error reading image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Trigger browser file download and release object URL properly
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Inspect page count of a PDF file while rejecting encrypted/password-protected files.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const buffer = await readFileAsArrayBuffer(file);
  try {
    const pdfDoc = await loadUnencryptedPdf(buffer, { updateMetadata: false });
    return pdfDoc.getPageCount();
  } catch (err) {
    if (isEncryptedPdfError(err) || (err instanceof Error && err.message === ENCRYPTED_PDF_ERROR_MESSAGE)) {
      throw err;
    }
    console.warn('Falling back to pdfjs to inspect page count:', err);
    const { doc, cleanup } = await openUnencryptedPdfJsDocument(buffer);
    try {
      return doc.numPages;
    } finally {
      await cleanup();
    }
  }
}

/**
 * Parse page range string like "1-3, 5, 7-9" into an array of 0-based page indices
 * Validates against maxPages.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(`Invalid page range token: "${part}". Format should be e.g. 1-4`);
      }

      for (let p = start; p <= Math.min(end, maxPages); p++) {
        pagesSet.add(p - 1);
      }
    } else {
      const p = parseInt(part, 10);
      if (isNaN(p) || p < 1 || p > maxPages) {
        throw new Error(`Invalid page number: "${part}". Must be between 1 and ${maxPages}`);
      }
      pagesSet.add(p - 1);
    }
  }

  const sorted = Array.from(pagesSet).sort((a, b) => a - b);
  if (sorted.length === 0) {
    throw new Error('Please specify at least one valid page number');
  }
  return sorted;
}

/**
 * Render a single PDF page into a canvas
 */
export async function renderPdfPageToCanvas(
  pdfDocProxy: any,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdfDocProxy.getPage(pageNumber);
  try {
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not create 2D canvas context');

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    return canvas;
  } finally {
    page.cleanup?.();
  }
}
