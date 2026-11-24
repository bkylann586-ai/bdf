import JSZip from 'jszip';
import { BatchProgressItem, ProcessingFile, ProcessingResult } from '../types';
import { validateSelectedFiles } from './fileValidation';
import { getPdfPageCount } from './pdfUtils';
import type { PdfToImagesResult } from './pdfToImages';

export function createBatchProgressItems(files: ProcessingFile[]): BatchProgressItem[] {
  return files.map((fileItem) => ({
    id: fileItem.id,
    name: fileItem.name,
    size: fileItem.size,
    status: 'pending',
    progress: 0,
  }));
}

export function updateBatchProgressItems(
  prev: BatchProgressItem[],
  index: number,
  status: 'processing' | 'completed' | 'error',
  itemPercent?: number,
  detail?: string
): BatchProgressItem[] {
  return prev.map((item, idx) =>
    idx === index
      ? {
          ...item,
          status,
          progress: itemPercent ?? (status === 'completed' ? 100 : item.progress),
          detail: detail ?? item.detail,
        }
      : item
  );
}

export interface BatchItemOutcome<T> {
  fileItem: ProcessingFile;
  status: 'success' | 'error';
  result?: T;
  error?: string;
}

export interface BatchRunSummary<T> {
  items: BatchItemOutcome<T>[];
  successCount: number;
  errorCount: number;
  cancelled: boolean;
}

export interface BatchPdfZipSummary {
  zipBlob: Blob;
  zipFilename: string;
  totalOriginalSize: number;
  totalProcessedSize: number;
  successCount: number;
}

export interface BatchImagesZipSummary {
  zipBlob: Blob;
  zipFilename: string;
  totalImages: number;
  successCount: number;
}

/**
 * Validate newly selected/dropped PDFs against the 250 MB cumulative queue limit
 * and inspect each file's page count (rejecting encrypted/corrupted PDFs individually).
 */
export async function validateAndInspectPdfQueue(
  incomingFiles: File[],
  existingFiles: ProcessingFile[]
): Promise<{ validItems: ProcessingFile[]; errorMessage: string | null }> {
  const existingTotalBytes = existingFiles.reduce((sum, item) => sum + item.size, 0);
  const validation = await validateSelectedFiles(incomingFiles, {
    accept: 'application/pdf,.pdf',
    multiple: true,
    existingTotalBytes,
  });

  const errorParts: string[] = [];
  if (validation.errorMessage) {
    errorParts.push(validation.errorMessage);
  }

  const validItems: ProcessingFile[] = [];

  for (const file of validation.validFiles) {
    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      const pageCount = await getPdfPageCount(file);
      validItems.push({
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        pageCount: pageCount > 0 ? pageCount : 1,
      });
    } catch (err: any) {
      errorParts.push(`"${file.name}": ${err?.message || 'Failed to read PDF.'}`);
    }
  }

  return {
    validItems,
    errorMessage: errorParts.length > 0 ? errorParts.join(' ') : null,
  };
}

/**
 * Generate a collision-free filename or folder name inside a batch ZIP archive.
 */
export function buildUniqueArchiveName(desiredName: string, usedNames: Set<string>): string {
  const normalized = desiredName.trim() || 'document';
  if (!usedNames.has(normalized.toLowerCase())) {
    usedNames.add(normalized.toLowerCase());
    return normalized;
  }

  const dotIdx = normalized.lastIndexOf('.');
  const stem = dotIdx > 0 ? normalized.slice(0, dotIdx) : normalized;
  const ext = dotIdx > 0 ? normalized.slice(dotIdx) : '';

  let counter = 2;
  while (counter < 10000) {
    const candidate = `${stem}-${counter}${ext}`;
    if (!usedNames.has(candidate.toLowerCase())) {
      usedNames.add(candidate.toLowerCase());
      return candidate;
    }
    counter++;
  }

  const fallback = `${stem}-${Date.now()}${ext}`;
  usedNames.add(fallback.toLowerCase());
  return fallback;
}

/**
 * Process a queue of PDF files strictly one-by-one (sequentially) to keep browser RAM
 * and HTML5 Canvas usage bounded across multi-file batches.
 */
export async function runSequentialBatch<T>(
  files: ProcessingFile[],
  processItem: (
    fileItem: ProcessingFile,
    onItemProgress: (current: number, total: number, message: string) => void
  ) => Promise<T>,
  options: {
    onProgress?: (current: number, total: number, message: string) => void;
    onItemStatus?: (
      index: number,
      status: 'processing' | 'completed' | 'error',
      itemPercent?: number,
      detail?: string
    ) => void;
    signal?: AbortSignal;
  } = {}
): Promise<BatchRunSummary<T>> {
  const totalFiles = files.length;
  const stepsPerFile = 100;
  const totalSteps = Math.max(1, totalFiles * stepsPerFile);
  const items: BatchItemOutcome<T>[] = [];
  let successCount = 0;
  let errorCount = 0;
  let cancelled = false;

  for (let i = 0; i < totalFiles; i++) {
    if (options.signal?.aborted) {
      cancelled = true;
      break;
    }

    const fileItem = files[i];
    const baseOffset = i * stepsPerFile;
    const prefix = totalFiles > 1 ? `File ${i + 1} of ${totalFiles} (${fileItem.name}): ` : '';

    options.onItemStatus?.(i, 'processing', 5, 'Starting...');
    options.onProgress?.(
      baseOffset + 1,
      totalSteps,
      `${prefix}Starting processing...`
    );

    try {
      const result = await processItem(fileItem, (curr, tot, msg) => {
        const safeTotal = tot > 0 ? tot : 1;
        const fraction = Math.min(1, Math.max(0, curr / safeTotal));
        const itemPct = Math.max(5, Math.min(99, Math.round(fraction * 100)));
        const normalizedStep = Math.min(
          totalSteps,
          baseOffset + Math.max(1, Math.round(fraction * stepsPerFile))
        );
        options.onItemStatus?.(i, 'processing', itemPct, msg);
        options.onProgress?.(normalizedStep, totalSteps, `${prefix}${msg}`);
      });

      options.onItemStatus?.(i, 'completed', 100, 'Completed');
      items.push({ fileItem, status: 'success', result });
      successCount++;
    } catch (err: any) {
      if (options.signal?.aborted || err?.name === 'AbortError') {
        cancelled = true;
        break;
      }
      const errMsg = err?.message || 'Processing failed for this file.';
      options.onItemStatus?.(i, 'error', 100, errMsg);
      items.push({
        fileItem,
        status: 'error',
        error: errMsg,
      });
      errorCount++;
    }
  }

  return {
    items,
    successCount,
    errorCount,
    cancelled,
  };
}

/**
 * Bundle successful PDF ProcessingResult items from a batch into one deduplicated ZIP archive.
 */
export async function packageBatchPdfsToZip(
  items: BatchItemOutcome<ProcessingResult>[],
  zipFilename: string
): Promise<BatchPdfZipSummary> {
  const zip = new JSZip();
  const usedNames = new Set<string>();
  let totalOriginalSize = 0;
  let totalProcessedSize = 0;
  let successCount = 0;

  for (const item of items) {
    if (item.status === 'success' && item.result) {
      const entryName = buildUniqueArchiveName(item.result.downloadName, usedNames);
      zip.file(entryName, item.result.blob);
      totalOriginalSize += item.result.originalSize ?? item.fileItem.size;
      totalProcessedSize += item.result.fileSize;
      successCount++;
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 5 },
  });

  return {
    zipBlob,
    zipFilename,
    totalOriginalSize,
    totalProcessedSize,
    successCount,
  };
}

/**
 * Bundle rendered images across multiple PDFs into a single organized ZIP archive
 * with one folder per source PDF.
 */
export async function packageBatchImagesToZip(
  items: BatchItemOutcome<PdfToImagesResult>[],
  zipFilename: string
): Promise<BatchImagesZipSummary> {
  const zip = new JSZip();
  const usedFolderNames = new Set<string>();
  let totalImages = 0;
  let successCount = 0;

  for (const item of items) {
    if (item.status === 'success' && item.result) {
      const baseName = item.fileItem.name.replace(/\.[^/.]+$/, '') || 'document';
      const folderName = buildUniqueArchiveName(`${baseName}_images`, usedFolderNames);
      const folder = zip.folder(folderName) || zip;
      const usedImageNames = new Set<string>();

      for (const img of item.result.images) {
        const entryName = buildUniqueArchiveName(img.filename, usedImageNames);
        folder.file(entryName, img.blob);
        totalImages++;
      }
      successCount++;
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 5 },
  });

  return {
    zipBlob,
    zipFilename,
    totalImages,
    successCount,
  };
}
