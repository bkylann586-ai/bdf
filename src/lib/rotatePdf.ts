import { degrees } from 'pdf-lib';
import { ProcessingFile, ProcessingResult, RotateOptions } from '../types';
import { loadUnencryptedPdf, parsePageRange, readFileAsArrayBuffer } from './pdfUtils';

export interface RotateProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Permanently rotate selected PDF pages by 90, 180, or 270 degrees clockwise.
 */
export async function rotatePdfFile(
  fileItem: ProcessingFile,
  options: RotateOptions,
  onProgress?: RotateProgressCallback
): Promise<ProcessingResult> {
  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  if (onProgress) onProgress(1, 3, 'Loading PDF catalog in browser memory...');

  const pdfDoc = await loadUnencryptedPdf(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  let targetIndices: number[] = [];
  if (options.pageSelection === 'range') {
    if (!options.pageRange.trim()) {
      throw new Error('Please enter a valid page range to rotate (e.g. 1-3, 5).');
    }
    targetIndices = parsePageRange(options.pageRange, totalPages);
  } else {
    for (let i = 0; i < totalPages; i++) targetIndices.push(i);
  }

  const pages = pdfDoc.getPages();
  for (let i = 0; i < targetIndices.length; i++) {
    const pageIdx = targetIndices[i];
    const page = pages[pageIdx];
    const currentRotation = page.getRotation().angle || 0;
    const nextRotation = ((currentRotation % 360) + 360 + options.angle) % 360;
    page.setRotation(degrees(nextRotation));
  }

  if (onProgress) {
    onProgress(2, 3, `Updated orientation on ${targetIndices.length} page(s)...`);
  }

  pdfDoc.setProducer('PDFQuick');
  const rotatedBytes = await pdfDoc.save();
  const blob = new Blob([rotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  if (onProgress) onProgress(3, 3, 'Finalizing rotated PDF...');

  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    downloadName: `${baseName}-rotated-${options.angle}.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount: totalPages,
    itemCount: targetIndices.length,
    message: `Rotated ${targetIndices.length} of ${totalPages} page(s) permanently by ${options.angle}° clockwise.`,
  };
}
