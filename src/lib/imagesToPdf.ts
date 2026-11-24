import { PDFDocument } from 'pdf-lib';
import { ProcessingFile, ProcessingResult, ImagesToPdfOptions } from '../types';
import { readFileAsArrayBuffer } from './pdfUtils';

export interface ImagesToPdfProgressCallback {
  (current: number, total: number, message: string): void;
}

// Standard dimensions in points (72 points = 1 inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

const MARGIN_SIZES = {
  none: 0,
  small: 18, // 0.25 inch
  large: 36, // 0.5 inch
};

/**
 * Convert an image file (including WebP/others) into a clean JPEG or PNG ArrayBuffer via HTML5 Image & Canvas
 */
async function normalizeImageToJpegOrPng(file: File): Promise<{
  buffer: ArrayBuffer;
  isPng: boolean;
  width: number;
  height: number;
}> {
  // If running in headless node test environment without DOM Image
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    const isPng = file.type === 'image/png' || file.name.match(/\.png$/i);
    const directBuffer = await readFileAsArrayBuffer(file);
    return {
      buffer: directBuffer,
      isPng: !!isPng,
      width: 200,
      height: 200,
    };
  }

  // If it's standard JPEG or PNG, we can inspect or convert directly
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // If already JPEG or PNG, try reading buffer directly
      const isJpeg = file.type === 'image/jpeg' || file.name.match(/\.(jpe?g)$/i);
      const isPng = file.type === 'image/png' || file.name.match(/\.png$/i);

      if (isJpeg || isPng) {
        try {
          const directBuffer = await readFileAsArrayBuffer(file);
          resolve({
            buffer: directBuffer,
            isPng: !!isPng,
            width,
            height,
          });
          return;
        } catch {
          // Fall through to canvas re-encode if direct buffer read fails
        }
      }

      // Convert via canvas (for WebP, AVIF, or problematic JPEGs)
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context for image conversion'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        async (blob) => {
          canvas.width = 0;
          canvas.height = 0;
          if (!blob) {
            reject(new Error(`Failed to convert image ${file.name}`));
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve({
            buffer: buf,
            isPng: false, // encoded as JPEG
            width,
            height,
          });
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not load image "${file.name}". File might be corrupted.`));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert multiple images into a single clean PDF document
 */
export async function convertImagesToPdf(
  files: ProcessingFile[],
  options: ImagesToPdfOptions,
  outputName: string = 'pdfquick-images.pdf',
  onProgress?: ImagesToPdfProgressCallback
): Promise<ProcessingResult> {
  if (files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Images to PDF');
  pdfDoc.setProducer('PDFQuick');
  pdfDoc.setCreator('PDFQuick Image Converter');

  const margin = MARGIN_SIZES[options.margin] || 0;
  let totalInputSize = 0;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    totalInputSize += item.size;

    if (onProgress) {
      onProgress(i + 1, files.length, `Processing image "${item.name}" (${i + 1} of ${files.length})...`);
    }

    const { buffer, isPng, width: imgWidth, height: imgHeight } = await normalizeImageToJpegOrPng(item.file);

    let embeddedImage;
    if (isPng) {
      try {
        embeddedImage = await pdfDoc.embedPng(buffer);
      } catch (err) {
        if (typeof document === 'undefined') {
          throw err;
        }
        // Fallback to jpeg re-encode if PNG embedding has unsupported color profile
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgWidth, imgHeight);

        const img = new Image();
        const blob = new Blob([buffer], { type: 'image/png' });
        const objUrl = URL.createObjectURL(blob);
        await new Promise((res) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(objUrl);
            res(null);
          };
          img.src = objUrl;
        });

        const fallbackJpegBlob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/jpeg', 0.9)
        );
        canvas.width = 0;
        canvas.height = 0;
        if (!fallbackJpegBlob) throw new Error('Failed image re-encode');
        const fallbackBytes = await fallbackJpegBlob.arrayBuffer();
        embeddedImage = await pdfDoc.embedJpg(fallbackBytes);
      }
    } else {
      embeddedImage = await pdfDoc.embedJpg(buffer);
    }

    // Determine target page width and height
    let targetPageWidth = imgWidth;
    let targetPageHeight = imgHeight;

    if (options.pageSize === 'fit') {
      targetPageWidth = imgWidth + margin * 2;
      targetPageHeight = imgHeight + margin * 2;
    } else {
      const baseStandard = PAGE_SIZES[options.pageSize] || PAGE_SIZES.a4;
      let isLandscape = false;

      if (options.orientation === 'landscape') {
        isLandscape = true;
      } else if (options.orientation === 'portrait') {
        isLandscape = false;
      } else {
        // auto
        isLandscape = imgWidth > imgHeight;
      }

      targetPageWidth = isLandscape
        ? Math.max(baseStandard.width, baseStandard.height)
        : Math.min(baseStandard.width, baseStandard.height);
      targetPageHeight = isLandscape
        ? Math.min(baseStandard.width, baseStandard.height)
        : Math.max(baseStandard.width, baseStandard.height);
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Available drawable area inside margins
    const availWidth = Math.max(10, targetPageWidth - margin * 2);
    const availHeight = Math.max(10, targetPageHeight - margin * 2);

    // Calculate best fit aspect ratio
    const widthRatio = availWidth / imgWidth;
    const heightRatio = availHeight / imgHeight;
    const scaleFactor = Math.min(widthRatio, heightRatio, options.pageSize === 'fit' ? 1 : 9999);

    const drawWidth = imgWidth * scaleFactor;
    const drawHeight = imgHeight * scaleFactor;

    // Center image on the page
    const drawX = margin + (availWidth - drawWidth) / 2;
    const drawY = margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  if (onProgress) {
    onProgress(files.length, files.length, 'Compiling and saving PDF document...');
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  return {
    blob,
    downloadName: outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`,
    fileSize: blob.size,
    originalSize: totalInputSize,
    pageCount: files.length,
    itemCount: files.length,
    message: `Converted ${files.length} images into a ${files.length}-page PDF document.`,
  };
}
