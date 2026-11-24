import { StandardFonts, rgb } from 'pdf-lib';
import { AddPageNumbersOptions, ProcessingFile, ProcessingResult } from '../types';
import { loadUnencryptedPdf, readFileAsArrayBuffer } from './pdfUtils';

export interface PageNumbersProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Stamp formatted sequential page numbers onto a PDF inside browser memory.
 */
export async function addPageNumbersToPdf(
  fileItem: ProcessingFile,
  options: AddPageNumbersOptions,
  onProgress?: PageNumbersProgressCallback
): Promise<ProcessingResult> {
  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  if (onProgress) onProgress(1, 3, 'Loading PDF pages and embedding Helvetica font...');

  const pdfDoc = await loadUnencryptedPdf(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = Math.min(24, Math.max(8, Math.round(options.fontSize || 11)));
  const startNumber = Math.max(1, Math.round(options.startNumber || 1));
  const shouldSkipFirst = options.skipFirstPage && totalPages > 1;
  const numberedTotal = shouldSkipFirst ? totalPages - 1 : totalPages;
  const pages = pdfDoc.getPages();
  let numberedCount = 0;

  if (onProgress) onProgress(2, 3, 'Applying page numbers across document bounds...');

  for (let idx = 0; idx < totalPages; idx++) {
    if (shouldSkipFirst && idx === 0) {
      continue;
    }

    const page = pages[idx];
    const displayNum = startNumber + numberedCount;
    const displayTotal = startNumber + numberedTotal - 1;
    numberedCount += 1;

    let label = String(displayNum);
    if (options.format === 'page_n') {
      label = `Page ${displayNum}`;
    } else if (options.format === 'page_n_of_total') {
      label = `Page ${displayNum} of ${displayTotal}`;
    }

    const cropBox = page.getCropBox();
    const boxX = cropBox.x || 0;
    const boxY = cropBox.y || 0;
    const boxWidth = cropBox.width;
    const boxHeight = cropBox.height;

    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const horizontalMargin = Math.min(36, boxWidth * 0.08);
    const verticalMargin = Math.min(28, boxHeight * 0.06);

    let x = boxX + (boxWidth - textWidth) / 2;
    let y = boxY + verticalMargin;

    switch (options.position) {
      case 'bottom-left':
        x = boxX + horizontalMargin;
        y = boxY + verticalMargin;
        break;
      case 'bottom-right':
        x = boxX + boxWidth - horizontalMargin - textWidth;
        y = boxY + verticalMargin;
        break;
      case 'top-center':
        x = boxX + (boxWidth - textWidth) / 2;
        y = boxY + boxHeight - verticalMargin - fontSize * 0.75;
        break;
      case 'top-right':
        x = boxX + boxWidth - horizontalMargin - textWidth;
        y = boxY + boxHeight - verticalMargin - fontSize * 0.75;
        break;
      case 'bottom-center':
      default:
        x = boxX + (boxWidth - textWidth) / 2;
        y = boxY + verticalMargin;
        break;
    }

    page.drawText(label, {
      x: Math.max(boxX + 8, x),
      y: Math.max(boxY + 8, y),
      size: fontSize,
      font,
      color: rgb(0.18, 0.22, 0.28),
    });
  }

  pdfDoc.setProducer('PDFQuick');
  const numberedBytes = await pdfDoc.save();
  const blob = new Blob([numberedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  if (onProgress) onProgress(3, 3, 'Finalizing numbered PDF...');

  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    downloadName: `${baseName}-numbered.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount: totalPages,
    itemCount: numberedCount,
    message: `Added formatted page numbers to ${numberedCount} of ${totalPages} page(s).`,
  };
}
