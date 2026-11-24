import { StandardFonts, degrees, rgb } from 'pdf-lib';
import { ProcessingFile, ProcessingResult, WatermarkColor, WatermarkOptions } from '../types';
import { loadUnencryptedPdf, parsePageRange, readFileAsArrayBuffer } from './pdfUtils';

export interface WatermarkProgressCallback {
  (current: number, total: number, message: string): void;
}

const COLOR_MAP: Record<WatermarkColor, ReturnType<typeof rgb>> = {
  slate: rgb(0.35, 0.4, 0.48),
  red: rgb(0.78, 0.14, 0.18),
  blue: rgb(0.12, 0.36, 0.72),
};

/**
 * Stamp a customizable diagonal, centered, or tiled text watermark onto PDF pages.
 */
export async function addWatermarkToPdf(
  fileItem: ProcessingFile,
  options: WatermarkOptions,
  onProgress?: WatermarkProgressCallback
): Promise<ProcessingResult> {
  const watermarkText = options.text.trim();
  if (!watermarkText) {
    throw new Error('Please enter watermark text before applying.');
  }
  if (watermarkText.length > 80) {
    throw new Error('Watermark text must be 80 characters or fewer.');
  }

  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  if (onProgress) onProgress(1, 3, 'Loading PDF pages and bold typography...');

  const pdfDoc = await loadUnencryptedPdf(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  let targetIndices: number[] = [];
  if (options.pageSelection === 'range') {
    if (!options.pageRange.trim()) {
      throw new Error('Please specify target pages or switch to All Pages.');
    }
    targetIndices = parsePageRange(options.pageRange, totalPages);
  } else {
    for (let i = 0; i < totalPages; i++) targetIndices.push(i);
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const opacity = Math.min(0.85, Math.max(0.1, options.opacity ?? 0.28));
  const baseFontSize = Math.min(96, Math.max(16, Math.round(options.fontSize || 48)));
  const color = COLOR_MAP[options.color] || COLOR_MAP.slate;
  const pages = pdfDoc.getPages();

  if (onProgress) {
    onProgress(2, 3, `Stamping "${watermarkText}" onto ${targetIndices.length} page(s)...`);
  }

  for (const pageIdx of targetIndices) {
    const page = pages[pageIdx];
    const cropBox = page.getCropBox();
    const boxX = cropBox.x || 0;
    const boxY = cropBox.y || 0;
    const boxWidth = cropBox.width;
    const boxHeight = cropBox.height;

    if (options.position === 'tiled') {
      const tileFontSize = Math.max(14, Math.round(baseFontSize * 0.55));
      const textWidth = font.widthOfTextAtSize(watermarkText, tileFontSize);
      const angleDeg = 35;
      const rad = (angleDeg * Math.PI) / 180;
      const cols = 2;
      const rows = 3;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = boxX + ((c + 0.5) / cols) * boxWidth;
          const cy = boxY + ((r + 0.5) / rows) * boxHeight;
          const x = cx - (textWidth / 2) * Math.cos(rad);
          const y = cy - (textWidth / 2) * Math.sin(rad);

          page.drawText(watermarkText, {
            x,
            y,
            size: tileFontSize,
            font,
            color,
            opacity,
            rotate: degrees(angleDeg),
          });
        }
      }
      continue;
    }

    // Auto-scale font size slightly if long text would clip outside page width
    const rawWidth = font.widthOfTextAtSize(watermarkText, baseFontSize);
    const maxAllowedSpan =
      options.position === 'diagonal'
        ? Math.hypot(boxWidth, boxHeight) * 0.72
        : boxWidth * 0.84;
    const effectiveFontSize =
      rawWidth > maxAllowedSpan && rawWidth > 0
        ? Math.max(14, baseFontSize * (maxAllowedSpan / rawWidth))
        : baseFontSize;

    const textWidth = font.widthOfTextAtSize(watermarkText, effectiveFontSize);
    const textHeight = effectiveFontSize * 0.7;
    const cx = boxX + boxWidth / 2;
    const cy = boxY + boxHeight / 2;

    if (options.position === 'center') {
      page.drawText(watermarkText, {
        x: cx - textWidth / 2,
        y: cy - textHeight / 2,
        size: effectiveFontSize,
        font,
        color,
        opacity,
      });
    } else {
      const angleDeg = 45;
      const rad = (angleDeg * Math.PI) / 180;
      const x = cx - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
      const y = cy - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

      page.drawText(watermarkText, {
        x,
        y,
        size: effectiveFontSize,
        font,
        color,
        opacity,
        rotate: degrees(angleDeg),
      });
    }
  }

  pdfDoc.setProducer('PDFQuick');
  const stampedBytes = await pdfDoc.save();
  const blob = new Blob([stampedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  if (onProgress) onProgress(3, 3, 'Finalizing watermarked PDF...');

  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
  return {
    blob,
    downloadName: `${baseName}-watermarked.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount: totalPages,
    itemCount: targetIndices.length,
    message: `Applied "${watermarkText}" watermark to ${targetIndices.length} of ${totalPages} page(s).`,
  };
}
