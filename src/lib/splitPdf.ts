import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { ProcessingFile, ProcessingResult, SplitOptions } from '../types';
import { readFileAsArrayBuffer, parsePageRange, loadUnencryptedPdf } from './pdfUtils';

export interface SplitProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Split a PDF file according to specified mode and options
 */
export async function splitPdfFile(
  fileItem: ProcessingFile,
  options: SplitOptions,
  onProgress?: SplitProgressCallback
): Promise<ProcessingResult> {
  const arrayBuffer = await readFileAsArrayBuffer(fileItem.file);
  const srcDoc = await loadUnencryptedPdf(arrayBuffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');

  // Mode 1: Extract specified page range into a single new PDF
  if (options.mode === 'range') {
    if (!options.pageRange.trim()) {
      throw new Error('Please enter a valid page range (e.g. 1-3, 5).');
    }

    if (onProgress) onProgress(1, 2, 'Parsing requested page range...');
    const pageIndices = parsePageRange(options.pageRange, totalPages);

    if (onProgress) onProgress(2, 2, `Extracting ${pageIndices.length} page(s)...`);
    const newDoc = await PDFDocument.create();
    newDoc.setTitle(`${baseName} - Extracted Pages`);
    newDoc.setProducer('PDFQuick');

    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    const outputBytes = await newDoc.save();
    const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const downloadName = `${baseName}-pages-${options.pageRange.replace(/[\s,]+/g, '_')}.pdf`;

    return {
      blob,
      downloadName,
      fileSize: blob.size,
      originalSize: fileItem.size,
      pageCount: copiedPages.length,
      message: `Extracted ${copiedPages.length} pages into a single PDF.`,
    };
  }

  // Mode 2: Split all pages into individual PDFs and package in a ZIP
  if (options.mode === 'all') {
    const zip = new JSZip();
    const folder = zip.folder(`${baseName}_pages`) || zip;

    for (let i = 0; i < totalPages; i++) {
      if (onProgress) {
        onProgress(i + 1, totalPages, `Extracting page ${i + 1} of ${totalPages}...`);
      }

      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copiedPage);

      const pageBytes = await singleDoc.save();
      const padIndex = String(i + 1).padStart(String(totalPages).length, '0');
      folder.file(`${baseName}_page_${padIndex}.pdf`, pageBytes);
    }

    if (onProgress) {
      onProgress(totalPages, totalPages, 'Compressing ZIP archive...');
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return {
      blob: zipBlob,
      downloadName: `${baseName}-all-pages.zip`,
      fileSize: zipBlob.size,
      originalSize: fileItem.size,
      pageCount: totalPages,
      itemCount: totalPages,
      message: `Separated ${totalPages} pages into individual PDF files packaged in a ZIP archive.`,
    };
  }

  // Mode 3: Split into chunks of N pages each
  if (options.mode === 'chunk') {
    const chunkSize = Math.max(1, Math.min(options.chunkSize || 1, totalPages));
    const zip = new JSZip();
    const folder = zip.folder(`${baseName}_split`) || zip;
    let chunkIndex = 1;
    const totalChunks = Math.ceil(totalPages / chunkSize);

    for (let start = 0; start < totalPages; start += chunkSize) {
      const end = Math.min(start + chunkSize, totalPages);
      if (onProgress) {
        onProgress(
          chunkIndex,
          totalChunks,
          `Generating part ${chunkIndex} of ${totalChunks} (pages ${start + 1} to ${end})...`
        );
      }

      const chunkDoc = await PDFDocument.create();
      const indices: number[] = [];
      for (let p = start; p < end; p++) indices.push(p);

      const copiedPages = await chunkDoc.copyPages(srcDoc, indices);
      for (const page of copiedPages) {
        chunkDoc.addPage(page);
      }

      const chunkBytes = await chunkDoc.save();
      folder.file(
        `${baseName}_part_${chunkIndex}_pages_${start + 1}-${end}.pdf`,
        chunkBytes
      );
      chunkIndex++;
    }

    if (onProgress) {
      onProgress(totalChunks, totalChunks, 'Creating ZIP archive...');
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return {
      blob: zipBlob,
      downloadName: `${baseName}-split-chunks.zip`,
      fileSize: zipBlob.size,
      originalSize: fileItem.size,
      pageCount: totalPages,
      itemCount: totalChunks,
      message: `Split ${totalPages} pages into ${totalChunks} documents packaged in a ZIP archive.`,
    };
  }

  throw new Error('Unsupported split mode');
}
