import { PDFDocument } from 'pdf-lib';
import { DeletePagesOptions, ProcessingFile, ProcessingResult } from '../types';
import { loadUnencryptedPdf, parsePageRange, readFileAsArrayBuffer } from './pdfUtils';

export interface DeletePagesProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Remove specified pages or page ranges from a PDF and output a clean pruned PDF.
 */
export async function deletePagesFromPdf(
  fileItem: ProcessingFile,
  options: DeletePagesOptions,
  onProgress?: DeletePagesProgressCallback
): Promise<ProcessingResult> {
  if (!options.pageRange.trim()) {
    throw new Error('Please enter page numbers or ranges to delete (e.g. 2, 4-5).');
  }

  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  if (onProgress) onProgress(1, 3, 'Inspecting PDF page tree...');

  const srcDoc = await loadUnencryptedPdf(arrayBuffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const removeIndices = parsePageRange(options.pageRange, totalPages);
  const removeSet = new Set<number>(removeIndices);

  const keepIndices: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!removeSet.has(i)) {
      keepIndices.push(i);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error('Cannot delete every page. At least 1 page must remain in the PDF document.');
  }

  if (onProgress) {
    onProgress(2, 3, `Removing ${removeSet.size} page(s) and rebuilding clean PDF...`);
  }

  const outputDoc = await PDFDocument.create();
  outputDoc.setTitle(`${fileItem.name.replace(/\.[^/.]+$/, '')} (Edited)`);
  outputDoc.setProducer('PDFQuick');

  const copiedPages = await outputDoc.copyPages(srcDoc, keepIndices);
  for (const page of copiedPages) {
    outputDoc.addPage(page);
  }

  const outputBytes = await outputDoc.save();
  const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  if (onProgress) onProgress(3, 3, 'Finalizing updated PDF...');

  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    downloadName: `${baseName}-pages-removed.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount: keepIndices.length,
    itemCount: removeSet.size,
    message: `Removed ${removeSet.size} page(s); saved clean ${keepIndices.length}-page PDF.`,
  };
}
