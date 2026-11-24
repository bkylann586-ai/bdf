import JSZip from 'jszip';
import { ProcessingFile, PdfToImagesOptions } from '../types';
import {
  CanvasScaleClampInfo,
  openUnencryptedPdfJsDocument,
  parsePageRange,
  readFileAsArrayBuffer,
  releaseCanvasMemory,
  renderPdfPageToCanvas,
} from './pdfUtils';

export interface RenderedPageImage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
  size: number;
  filename: string;
}

export interface PdfToImagesResult {
  images: RenderedPageImage[];
  zipBlob: Blob;
  zipFilename: string;
  totalRendered: number;
  format: 'png' | 'jpeg';
  warnings?: string[];
}

export interface PdfToImagesProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Render PDF pages into PNG or JPEG images with ZIP archive generation and canvas memory protection
 */
export async function convertPdfToImages(
  fileItem: ProcessingFile,
  options: PdfToImagesOptions,
  onProgress?: PdfToImagesProgressCallback
): Promise<PdfToImagesResult> {
  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  const { doc: pdfJsDoc, cleanup } = await openUnencryptedPdfJsDocument(arrayBuffer);

  try {
    const totalPages = pdfJsDoc.numPages;

    if (totalPages === 0) {
      throw new Error('This PDF has 0 pages.');
    }

    // Determine which page indices to render (0-based)
    let targetIndices: number[] = [];
    if (options.pageSelection === 'range' && options.pageRange.trim()) {
      targetIndices = parsePageRange(options.pageRange, totalPages);
    } else {
      for (let i = 0; i < totalPages; i++) targetIndices.push(i);
    }

    const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
    const isPng = options.format === 'image/png';
    const extension = isPng ? 'png' : 'jpg';
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const quality = isPng ? undefined : Math.min(1.0, Math.max(0.6, options.quality || 0.9));

    const renderedImages: RenderedPageImage[] = [];
    const clampedPages: CanvasScaleClampInfo[] = [];
    const zip = new JSZip();
    const folder = zip.folder(`${baseName}_images`) || zip;

    const totalToRender = targetIndices.length;

    for (let idx = 0; idx < totalToRender; idx++) {
      const pageIndex = targetIndices[idx];
      const pageNumber = pageIndex + 1;

      if (onProgress) {
        onProgress(
          idx + 1,
          totalToRender,
          `Rendering page ${pageNumber} (${idx + 1} of ${totalToRender})...`
        );
      }

      const canvas = await renderPdfPageToCanvas(pdfJsDoc, pageNumber, options.scale, {
        allowScaleClamp: true,
        onScaleClamped: (info) => {
          clampedPages.push(info);
        },
      });
      let width = 0;
      let height = 0;
      let blob: Blob;

      try {
        width = canvas.width;
        height = canvas.height;
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error(`Failed to render canvas for page ${pageNumber}`));
            },
            mimeType,
            quality
          );
        });
      } finally {
        releaseCanvasMemory(canvas);
      }

      const padNumber = String(pageNumber).padStart(String(totalPages).length, '0');
      const filename = `${baseName}_page_${padNumber}.${extension}`;

      folder.file(filename, blob);

      renderedImages.push({
        pageNumber,
        blob,
        width,
        height,
        size: blob.size,
        filename,
      });
    }

    if (onProgress) {
      onProgress(totalToRender, totalToRender, 'Packaging images into ZIP archive...');
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 5 },
    });

    const warnings: string[] = [];
    if (clampedPages.length > 0) {
      const pageList = clampedPages
        .map((c) => `Page ${c.pageNumber} (${c.appliedScale.toFixed(2)}× -> ${c.appliedWidth}×${c.appliedHeight}px)`)
        .slice(0, 4)
        .join(', ');
      const extraCount = clampedPages.length > 4 ? ` (+${clampedPages.length - 4} more)` : '';
      warnings.push(
        `Browser canvas memory protection clamped ${clampedPages.length} high-resolution page(s) below your requested ${options.scale}× scale to avoid memory exhaustion: ${pageList}${extraCount}.`
      );
    }

    return {
      images: renderedImages,
      zipBlob,
      zipFilename: `${baseName}-images.zip`,
      totalRendered: renderedImages.length,
      format: isPng ? 'png' : 'jpeg',
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  } finally {
    await cleanup();
  }
}
