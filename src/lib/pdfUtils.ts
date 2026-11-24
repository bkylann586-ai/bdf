import { PDFDocument, EncryptedPDFError } from 'pdf-lib';
import {
  formatBytes,
  readFileAsArrayBuffer,
  readFileAsDataURL,
  downloadBlob,
  parsePageRange,
  formatPageNumbersToRange,
  togglePageInRangeString,
} from './fileHelpers';

export {
  formatBytes,
  readFileAsArrayBuffer,
  readFileAsDataURL,
  downloadBlob,
  parsePageRange,
  formatPageNumbersToRange,
  togglePageInRangeString,
};

export const MAX_CANVAS_PIXELS = 12_000_000; // ~48 MB RGBA allocation cap (safe across desktop & iOS/Android)
export const MAX_CANVAS_DIMENSION = 8192; // Safe max canvas width/height across major browsers
export const MIN_SAFE_RENDER_SCALE = 0.25;

export interface CanvasScaleClampInfo {
  pageNumber: number;
  requestedScale: number;
  appliedScale: number;
  requestedWidth: number;
  requestedHeight: number;
  appliedWidth: number;
  appliedHeight: number;
  maxPixels: number;
}

export interface RenderPdfPageOptions {
  maxPixels?: number;
  maxDimension?: number;
  allowScaleClamp?: boolean;
  onScaleClamped?: (info: CanvasScaleClampInfo) => void;
}

export class CanvasRenderLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanvasRenderLimitError';
  }
}

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
 * Open a PDF with PDF.js (loaded on demand) while rejecting both user-password and owner-encrypted documents,
 * and return a cleanup callback that releases worker/document resources.
 */
export async function openUnencryptedPdfJsDocument(
  buffer: ArrayBuffer
): Promise<{ doc: any; cleanup: () => Promise<void> }> {
  await assertUnencryptedPdfBuffer(buffer);

  const { pdfjsLib } = await import('./pdfWorker');
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
 * Explicitly release HTML5 Canvas pixel buffer memory after raster processing completes.
 */
export function releaseCanvasMemory(canvas: HTMLCanvasElement | null | undefined): void {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } catch {
    // Ignore context clear failures when canvas is already zeroed
  }
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Pre-calculate safe HTML5 Canvas pixel dimensions and controlled scale before buffer allocation.
 */
export function calculateSafeCanvasDimensions(
  baseWidth: number,
  baseHeight: number,
  requestedScale: number,
  pageNumber: number,
  options: RenderPdfPageOptions = {}
): {
  width: number;
  height: number;
  appliedScale: number;
  wasClamped: boolean;
  clampInfo?: CanvasScaleClampInfo;
} {
  if (
    !Number.isFinite(baseWidth) ||
    !Number.isFinite(baseHeight) ||
    baseWidth <= 0 ||
    baseHeight <= 0 ||
    !Number.isFinite(requestedScale) ||
    requestedScale <= 0
  ) {
    throw new CanvasRenderLimitError(
      `Page ${pageNumber} has invalid or corrupted dimensions (${baseWidth}×${baseHeight}).`
    );
  }

  const maxPixels = Math.max(100_000, options.maxPixels ?? MAX_CANVAS_PIXELS);
  const maxDimension = Math.max(512, options.maxDimension ?? MAX_CANVAS_DIMENSION);
  const allowScaleClamp = options.allowScaleClamp ?? true;

  const reqW = Math.max(1, Math.floor(baseWidth * requestedScale));
  const reqH = Math.max(1, Math.floor(baseHeight * requestedScale));
  const reqPixels = reqW * reqH;

  if (reqPixels <= maxPixels && reqW <= maxDimension && reqH <= maxDimension) {
    return {
      width: reqW,
      height: reqH,
      appliedScale: requestedScale,
      wasClamped: false,
    };
  }

  const areaScaleLimit = Math.sqrt(maxPixels / Math.max(1, baseWidth * baseHeight));
  const dimScaleLimit = Math.min(maxDimension / baseWidth, maxDimension / baseHeight);
  const maxSafeScale = Math.min(requestedScale, areaScaleLimit, dimScaleLimit);

  if (!allowScaleClamp || maxSafeScale < MIN_SAFE_RENDER_SCALE) {
    const mpRequested = (reqPixels / 1_000_000).toFixed(1);
    const mpLimit = (maxPixels / 1_000_000).toFixed(0);
    throw new CanvasRenderLimitError(
      `Page ${pageNumber} exceeds safe browser canvas memory limits (${reqW}×${reqH} px / ${mpRequested} MP requested; limit is ${mpLimit} MP and ${maxDimension}px max edge). Please lower resolution or split oversized sheets first.`
    );
  }

  // Round down conservatively to 2 decimal places, and nudge down if rounding pushed pixels/dim slightly over cap
  let safeScale = Math.max(MIN_SAFE_RENDER_SCALE, Math.floor(maxSafeScale * 100) / 100);
  let safeW = Math.max(1, Math.floor(baseWidth * safeScale));
  let safeH = Math.max(1, Math.floor(baseHeight * safeScale));

  while ((safeW * safeH > maxPixels || safeW > maxDimension || safeH > maxDimension) && safeScale > MIN_SAFE_RENDER_SCALE) {
    safeScale = Math.max(MIN_SAFE_RENDER_SCALE, Math.round((safeScale - 0.02) * 100) / 100);
    safeW = Math.max(1, Math.floor(baseWidth * safeScale));
    safeH = Math.max(1, Math.floor(baseHeight * safeScale));
  }

  if (safeW * safeH > maxPixels || safeW > maxDimension || safeH > maxDimension) {
    throw new CanvasRenderLimitError(
      `Page ${pageNumber} exceeds safe browser canvas memory limits even at minimum scale (${safeW}×${safeH} px).`
    );
  }

  const clampInfo: CanvasScaleClampInfo = {
    pageNumber,
    requestedScale,
    appliedScale: safeScale,
    requestedWidth: reqW,
    requestedHeight: reqH,
    appliedWidth: safeW,
    appliedHeight: safeH,
    maxPixels,
  };

  return {
    width: safeW,
    height: safeH,
    appliedScale: safeScale,
    wasClamped: true,
    clampInfo,
  };
}

/**
 * Render a single PDF page into an HTML5 Canvas with pre-allocation memory protection.
 */
export async function renderPdfPageToCanvas(
  pdfDocProxy: any,
  pageNumber: number,
  scale: number = 1.5,
  options: RenderPdfPageOptions = {}
): Promise<HTMLCanvasElement> {
  const page = await pdfDocProxy.getPage(pageNumber);
  let canvas: HTMLCanvasElement | null = null;
  try {
    const baseViewport = page.getViewport({ scale: 1.0 });
    const plan = calculateSafeCanvasDimensions(
      baseViewport.width,
      baseViewport.height,
      scale,
      pageNumber,
      options
    );

    if (plan.wasClamped && plan.clampInfo) {
      options.onScaleClamped?.(plan.clampInfo);
    }

    const viewport = page.getViewport({ scale: plan.appliedScale });

    canvas = document.createElement('canvas');
    canvas.width = Math.min(plan.width, Math.max(1, Math.floor(viewport.width)));
    canvas.height = Math.min(plan.height, Math.max(1, Math.floor(viewport.height)));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not create 2D canvas context');
    }

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    return canvas;
  } catch (err) {
    releaseCanvasMemory(canvas);
    throw err;
  } finally {
    page.cleanup?.();
  }
}
