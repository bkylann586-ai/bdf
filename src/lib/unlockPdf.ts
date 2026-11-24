import { createQpdf, QpdfError, type Qpdf } from '@mssio/qpdf-wasm';
import { ProcessingFile, ProcessingResult, UnlockPdfInspection } from '../types';
import { formatBytes } from './fileHelpers';

let qpdfPromise: Promise<Qpdf> | null = null;

/**
 * Lazily initialize and reuse a single client-side qpdf WebAssembly worker pool.
 * Nothing is fetched until the user loads or unlocks a PDF.
 */
export async function getQpdfInstance(): Promise<Qpdf> {
  if (!qpdfPromise) {
    qpdfPromise = createQpdf({ workers: 1 }).catch((err) => {
      qpdfPromise = null;
      throw err;
    });
  }
  return qpdfPromise;
}

function isInvalidPasswordError(err: unknown): boolean {
  if (err instanceof QpdfError && err.code === 'INVALID_PASSWORD') {
    return true;
  }
  if (err && typeof err === 'object') {
    const anyErr = err as { code?: string; message?: string };
    if (anyErr.code === 'INVALID_PASSWORD') return true;
    if (typeof anyErr.message === 'string' && /invalid password|incorrect password/i.test(anyErr.message)) {
      return true;
    }
  }
  return false;
}

function isInvalidPdfError(err: unknown): boolean {
  if (err instanceof QpdfError && err.code === 'INVALID_PDF') {
    return true;
  }
  if (err && typeof err === 'object') {
    const anyErr = err as { code?: string; message?: string };
    if (anyErr.code === 'INVALID_PDF') return true;
  }
  return false;
}

/**
 * Inspect whether a PDF requires an open (user) password, only has owner/permission
 * restrictions, or is already completely unencrypted.
 */
export async function inspectPdfEncryption(file: Blob): Promise<UnlockPdfInspection> {
  const qpdf = await getQpdfInstance();

  try {
    const info = await qpdf.info(file);
    if (!info.encrypted) {
      return {
        status: 'unencrypted',
        encrypted: false,
        requiresPassword: false,
        pdfVersion: info.pdfVersion,
        pageCount: info.pageCount,
      };
    }

    return {
      status: 'owner-locked',
      encrypted: true,
      requiresPassword: false,
      pdfVersion: info.pdfVersion,
      pageCount: info.pageCount,
    };
  } catch (err) {
    if (isInvalidPasswordError(err)) {
      return {
        status: 'password-required',
        encrypted: true,
        requiresPassword: true,
      };
    }

    if (isInvalidPdfError(err)) {
      throw new Error('This file does not appear to be a valid PDF document.');
    }

    const message = err instanceof Error ? err.message : 'Unable to inspect PDF encryption status.';
    throw new Error(message);
  }
}

/**
 * Decrypt an encrypted PDF strictly inside browser memory using qpdf-wasm.
 * Supports AES-256, AES-128, RC4-128, RC4-40, and owner-restricted PDFs.
 */
export async function unlockPdfDocument(
  fileItem: ProcessingFile,
  password: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ProcessingResult> {
  onProgress?.(1, 100, 'Initializing local WebAssembly decryption engine...');
  const qpdf = await getQpdfInstance();

  const inspection = await inspectPdfEncryption(fileItem.file);
  if (inspection.status === 'unencrypted') {
    throw new Error(
      'This PDF is already unlocked and does not have a password or permission restrictions.'
    );
  }

  if (inspection.status === 'password-required' && password.length === 0) {
    throw new Error('Please enter the PDF password to unlock this document.');
  }

  onProgress?.(15, 100, 'Verifying password and decrypting PDF streams locally...');

  let decryptedBytes: Uint8Array<ArrayBuffer>;
  try {
    const res = await qpdf.decrypt(fileItem.file, {
      password: password ?? '',
      onProgress: (percent) => {
        const mapped = Math.min(92, Math.max(18, Math.round(18 + percent * 0.74)));
        onProgress?.(mapped, 100, 'Writing decrypted PDF structure in browser memory...');
      },
    });
    decryptedBytes = res.output;
  } catch (err) {
    if (isInvalidPasswordError(err)) {
      throw new Error(
        'Incorrect password. Please check Caps Lock and try the document open or owner password again.'
      );
    }
    if (isInvalidPdfError(err)) {
      throw new Error('This file could not be parsed as a valid PDF document.');
    }
    const msg = err instanceof Error ? err.message : 'Failed to decrypt PDF.';
    throw new Error(msg);
  }

  onProgress?.(95, 100, 'Verifying unlocked PDF integrity...');
  let pageCount = inspection.pageCount;
  try {
    const unlockedInfo = await qpdf.info(decryptedBytes.slice());
    if (unlockedInfo.encrypted) {
      throw new Error('Decryption completed, but encryption metadata remained in the output.');
    }
    pageCount = unlockedInfo.pageCount;
  } catch (err) {
    if (err instanceof Error && err.message.includes('encryption metadata')) {
      throw err;
    }
    // If info check fails only unexpectedly, keep pageCount if known
  }

  onProgress?.(100, 100, 'Unlocked PDF ready for download.');
  const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
  const baseName = fileItem.name.replace(/\.pdf$/i, '') || 'document';
  const hadUserPassword = inspection.status === 'password-required';

  return {
    blob,
    downloadName: `${baseName}_unlocked.pdf`,
    fileSize: blob.size,
    pageCount,
    message: hadUserPassword
      ? `Password protection removed cleanly in your browser (${formatBytes(fileItem.size)} → ${formatBytes(blob.size)}).`
      : `Owner editing, copying, and printing restrictions removed cleanly in your browser (${formatBytes(fileItem.size)} → ${formatBytes(blob.size)}).`,
  };
}

/**
 * Encrypt a PDF buffer locally (used to build a realistic sample encrypted PDF for testing).
 */
export async function encryptSamplePdfBytes(
  pdfBytes: Uint8Array,
  userPassword: string,
  ownerPassword: string
): Promise<Uint8Array<ArrayBuffer>> {
  const qpdf = await getQpdfInstance();
  const { output } = await qpdf.encrypt(pdfBytes.slice(), {
    userPassword,
    ownerPassword,
    bits: 256,
    allow: {
      print: false,
      modify: false,
      extract: false,
      annotate: false,
    },
  });
  return output;
}
