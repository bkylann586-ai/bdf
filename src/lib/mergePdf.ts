import { PDFDocument } from 'pdf-lib';
import { ProcessingFile, ProcessingResult } from '../types';
import { readFileAsArrayBuffer, loadUnencryptedPdf, isEncryptedPdfError, ENCRYPTED_PDF_ERROR_MESSAGE } from './pdfUtils';

export interface MergeProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Merge multiple PDF files into a single unified document
 */
export async function mergePdfFiles(
  files: ProcessingFile[],
  outputName: string = 'pdfquick-merged.pdf',
  onProgress?: MergeProgressCallback
): Promise<ProcessingResult> {
  if (files.length < 2) {
    throw new Error('Please select at least two PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();
  mergedPdf.setTitle('Merged Document');
  mergedPdf.setProducer('PDFQuick');
  mergedPdf.setCreator('PDFQuick Client-side Engine');

  let totalPagesCount = 0;
  let totalInputSize = 0;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    totalInputSize += item.size;

    if (onProgress) {
      onProgress(i + 1, files.length, `Merging "${item.name}" (${i + 1} of ${files.length})...`);
    }

    try {
      const arrayBuffer = await readFileAsArrayBuffer(item.file);
      const srcDoc = await loadUnencryptedPdf(arrayBuffer);
      const indices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, indices);

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
      totalPagesCount += copiedPages.length;
    } catch (err: any) {
      if (isEncryptedPdfError(err)) {
        throw new Error(`"${item.name}": ${ENCRYPTED_PDF_ERROR_MESSAGE}`);
      }
      throw new Error(
        `Failed to process "${item.name}": ${err?.message || 'File may be corrupted or invalid.'}`
      );
    }
  }

  if (onProgress) {
    onProgress(files.length, files.length, 'Finalizing merged PDF document...');
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

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
