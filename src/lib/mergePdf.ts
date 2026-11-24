import { PDFDocument } from 'pdf-lib';
import { ProcessingFile, ProcessingResult } from '../types';
import {
  readFileAsArrayBuffer,
  loadUnencryptedPdf,
  isEncryptedPdfError,
  ENCRYPTED_PDF_ERROR_MESSAGE,
} from './pdfUtils';

export interface MergeProgressCallback {
  (current: number, total: number, message: string): void;
}

export interface MergeBatchOptions {
  signal?: AbortSignal;
  onItemStatus?: (
    index: number,
    status: 'processing' | 'completed' | 'error',
    itemPercent?: number,
    detail?: string
  ) => void;
}

const yieldToUi = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

function createAbortError(): Error {
  const err = new Error('Batch merge was cancelled.');
  err.name = 'AbortError';
  return err;
}

/**
 * Merge multiple PDF files into a single unified document with granular per-file batch progress.
 */
export async function mergePdfFiles(
  files: ProcessingFile[],
  outputName: string = 'pdfquick-merged.pdf',
  onProgress?: MergeProgressCallback,
  options: MergeBatchOptions = {}
): Promise<ProcessingResult> {
  if (files.length < 2) {
    throw new Error('Please select at least two PDF files to merge.');
  }

  const totalSteps = files.length * 100 + 20;
  const mergedPdf = await PDFDocument.create();
  mergedPdf.setTitle('Merged Document');
  mergedPdf.setProducer('PDFQuick');
  mergedPdf.setCreator('PDFQuick Client-side Engine');

  let totalPagesCount = 0;
  let totalInputSize = 0;

  for (let i = 0; i < files.length; i++) {
    if (options.signal?.aborted) {
      throw createAbortError();
    }

    const item = files[i];
    const baseStep = i * 100;
    totalInputSize += item.size;

    options.onItemStatus?.(i, 'processing', 15, 'Reading PDF bytes...');
    onProgress?.(
      baseStep + 15,
      totalSteps,
      `Merging "${item.name}" (${i + 1} of ${files.length})...`
    );
    await yieldToUi();

    try {
      const arrayBuffer = await readFileAsArrayBuffer(item.file);
      if (options.signal?.aborted) throw createAbortError();

      options.onItemStatus?.(i, 'processing', 55, 'Copying pages...');
      onProgress?.(
        baseStep + 55,
        totalSteps,
        `Copying pages from "${item.name}" (${i + 1} of ${files.length})...`
      );

      const srcDoc = await loadUnencryptedPdf(arrayBuffer);
      const indices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, indices);

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
      totalPagesCount += copiedPages.length;

      options.onItemStatus?.(
        i,
        'completed',
        100,
        `${copiedPages.length} ${copiedPages.length === 1 ? 'page' : 'pages'} merged`
      );
      onProgress?.(
        baseStep + 100,
        totalSteps,
        `Merged "${item.name}" (${i + 1} of ${files.length})`
      );
      await yieldToUi();
    } catch (err: any) {
      if (err?.name === 'AbortError' || options.signal?.aborted) {
        throw createAbortError();
      }
      options.onItemStatus?.(i, 'error', 100, err?.message || 'Failed');
      if (isEncryptedPdfError(err)) {
        throw new Error(`"${item.name}": ${ENCRYPTED_PDF_ERROR_MESSAGE}`);
      }
      throw new Error(
        `Failed to process "${item.name}": ${err?.message || 'File may be corrupted or invalid.'}`
      );
    }
  }

  if (options.signal?.aborted) {
    throw createAbortError();
  }

  onProgress?.(
    files.length * 100 + 10,
    totalSteps,
    'Finalizing merged PDF document...'
  );
  await yieldToUi();

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  onProgress?.(totalSteps, totalSteps, 'Merged PDF ready!');

  return {
    blob,
    downloadName: outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`,
    fileSize: blob.size,
    originalSize: totalInputSize,
    pageCount: totalPagesCount,
    itemCount: files.length,
    message: `Successfully merged ${files.length} documents into ${totalPagesCount} pages.`,
  };
}
