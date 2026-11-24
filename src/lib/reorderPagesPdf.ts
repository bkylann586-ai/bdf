import { PDFDocument } from 'pdf-lib';
import { ProcessingFile, ProcessingResult, ReorderPagesOptions } from '../types';
import { loadUnencryptedPdf, readFileAsArrayBuffer } from './pdfUtils';

export interface ReorderProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Rebuild a PDF with pages arranged in the exact user-specified 1-based page order.
 */
export async function reorderPdfPages(
  fileItem: ProcessingFile,
  options: ReorderPagesOptions,
  onProgress?: ReorderProgressCallback
): Promise<ProcessingResult> {
  if (!options.pageOrder || options.pageOrder.length === 0) {
    throw new Error('Please keep at least one page in the document order.');
  }

  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  if (onProgress) onProgress(1, 3, 'Reading PDF pages in browser memory...');

  const srcDoc = await loadUnencryptedPdf(arrayBuffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const zeroBasedIndices = options.pageOrder.map((pageNum) => {
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Invalid page number ${pageNum}. Document has ${totalPages} pages.`);
    }
    return pageNum - 1;
  });

  if (onProgress) {
    onProgress(2, 3, `Assembling ${zeroBasedIndices.length} page(s) in new sequence...`);
  }

  const outDoc = await PDFDocument.create();
  outDoc.setTitle(`${fileItem.name.replace(/\.[^/.]+$/, '')} (Reordered)`);
  outDoc.setProducer('PDFQuick');

  const copiedPages = await outDoc.copyPages(srcDoc, zeroBasedIndices);
  for (const page of copiedPages) {
    outDoc.addPage(page);
  }

  const reorderedBytes = await outDoc.save();
  const blob = new Blob([reorderedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  if (onProgress) onProgress(3, 3, 'Finalizing reordered PDF...');

  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    downloadName: `${baseName}-reordered.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount: copiedPages.length,
    message: `Saved ${copiedPages.length}-page PDF in your updated sequence.`,
  };
}
