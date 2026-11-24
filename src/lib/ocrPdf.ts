import { rgb } from 'pdf-lib';
import {
  OcrLanguageCode,
  OcrPageResult,
  OcrPdfOptions,
  OcrPdfResult,
  OcrWordBox,
  ProcessingFile,
} from '../types';
import {
  drawVisualPdfLine,
  embedMultilingualPdfFonts,
  shapeLogicalLineForPdf,
} from './arabicPdfText';
import {
  ENCRYPTED_PDF_ERROR_MESSAGE,
  isEncryptedPdfError,
  loadUnencryptedPdf,
  openUnencryptedPdfJsDocument,
  parsePageRange,
  readFileAsArrayBuffer,
  renderPdfPageToCanvas,
} from './pdfUtils';

export interface OcrProgressCallback {
  (current: number, total: number, message: string): void;
}

export interface CustomOcrRecognizeResult {
  text: string;
  confidence: number | null;
  words: OcrWordBox[];
}

export type CustomOcrPageRecognizer = (
  pageNumber: number,
  language: OcrLanguageCode,
  scale: number,
  pdfJsDoc: any
) => Promise<CustomOcrRecognizeResult>;

export interface RunPdfOcrExtraOptions {
  onProgress?: OcrProgressCallback;
  signal?: AbortSignal;
  /** Optional dependency injection for headless Node/unit tests where browser Canvas/Web Workers are absent */
  customRecognizePage?: CustomOcrPageRecognizer;
}

export const OCR_LANGUAGE_OPTIONS: {
  code: OcrLanguageCode;
  label: string;
  nativeHint: string;
}[] = [
  { code: 'eng', label: 'English', nativeHint: 'eng' },
  { code: 'ara', label: 'Arabic (العربية)', nativeHint: 'ara' },
  { code: 'spa', label: 'Spanish (Español)', nativeHint: 'spa' },
  { code: 'fra', label: 'French (Français)', nativeHint: 'fra' },
  { code: 'deu', label: 'German (Deutsch)', nativeHint: 'deu' },
  { code: 'eng+ara', label: 'English + Arabic', nativeHint: 'eng+ara' },
  { code: 'eng+spa', label: 'English + Spanish', nativeHint: 'eng+spa' },
  { code: 'eng+fra', label: 'English + French', nativeHint: 'eng+fra' },
];

const MIN_EMBEDDED_TEXT_CHARS = 20;
const MAX_OCR_CANVAS_PIXELS = 10_000_000; // ~10 MP safety ceiling per page

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const abortErr = new Error('OCR processing was cancelled.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Extract flattened word bounding boxes from Tesseract.js v7 Page blocks structure.
 */
function extractWordsFromTesseractPage(
  data: any,
  canvasWidth: number,
  canvasHeight: number
): OcrWordBox[] {
  const wordsOut: OcrWordBox[] = [];
  if (!data || canvasWidth <= 0 || canvasHeight <= 0) {
    return wordsOut;
  }

  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    const paragraphs = Array.isArray(block?.paragraphs) ? block.paragraphs : [];
    for (const para of paragraphs) {
      const lines = Array.isArray(para?.lines) ? para.lines : [];
      for (const line of lines) {
        const words = Array.isArray(line?.words) ? line.words : [];
        for (const w of words) {
          const wordText = typeof w?.text === 'string' ? w.text.trim() : '';
          const bbox = w?.bbox;
          if (!wordText || !bbox) continue;

          const x0 = Math.max(0, Math.min(canvasWidth, Number(bbox.x0) || 0));
          const y0 = Math.max(0, Math.min(canvasHeight, Number(bbox.y0) || 0));
          const x1 = Math.max(x0, Math.min(canvasWidth, Number(bbox.x1) || x0));
          const y1 = Math.max(y0, Math.min(canvasHeight, Number(bbox.y1) || y0));

          wordsOut.push({
            text: wordText,
            xPct: x0 / canvasWidth,
            yPct: y0 / canvasHeight,
            widthPct: Math.max(0.005, (x1 - x0) / canvasWidth),
            heightPct: Math.max(0.008, (y1 - y0) / canvasHeight),
            confidence: typeof w.confidence === 'number' ? w.confidence : 0,
          });
        }
      }
    }
  }

  return wordsOut;
}

/**
 * Extract readable text straight from the PDF's existing text layer via PDF.js.
 */
async function readEmbeddedPageText(pdfJsDoc: any, pageNumber: number): Promise<string> {
  const page = await pdfJsDoc.getPage(pageNumber);
  try {
    const textContent = await page.getTextContent();
    const items = Array.isArray(textContent?.items) ? textContent.items : [];
    let out = '';
    let lastY: number | null = null;

    for (const item of items) {
      if (!item || typeof item.str !== 'string') continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        out += '\n';
      } else if (out && !out.endsWith(' ') && !out.endsWith('\n') && item.str && !item.str.startsWith(' ')) {
        out += ' ';
      }
      out += item.str;
      if (y !== null) {
        lastY = y;
      }
    }

    return out.trim();
  } finally {
    page.cleanup?.();
  }
}

/**
 * Compute clamped safe render scale so oversized blueprints or mobile PDFs never OOM canvas memory.
 */
async function computeSafeScale(
  pdfJsDoc: any,
  pageNumber: number,
  requestedScale: number
): Promise<{ safeScale: number; widthPt: number; heightPt: number }> {
  const page = await pdfJsDoc.getPage(pageNumber);
  try {
    const vp = page.getViewport({ scale: 1.0 });
    const widthPt = Math.max(36, vp.width || 612);
    const heightPt = Math.max(36, vp.height || 792);
    const basePixels = widthPt * heightPt;
    const maxAllowedScale = Math.sqrt(MAX_OCR_CANVAS_PIXELS / Math.max(1, basePixels));
    const safeScale = Math.max(1.0, Math.min(requestedScale, maxAllowedScale));
    return { safeScale, widthPt, heightPt };
  } finally {
    page.cleanup?.();
  }
}

/**
 * Perform lightweight, single-worker client-side OCR on an uploaded PDF using Tesseract.js + PDF.js,
 * and embed an invisible searchable text layer into a downloadable PDF copy via pdf-lib.
 */
export async function runPdfOcr(
  fileItem: ProcessingFile,
  options: OcrPdfOptions,
  extra: RunPdfOcrExtraOptions = {}
): Promise<OcrPdfResult> {
  const startedAt = Date.now();
  const { onProgress, signal, customRecognizePage } = extra;

  throwIfAborted(signal);
  onProgress?.(0, 100, 'Validating PDF structure inside browser memory...');

  const buffer = await readFileAsArrayBuffer(fileItem.file);
  let srcDoc;
  try {
    srcDoc = await loadUnencryptedPdf(buffer, { updateMetadata: false });
  } catch (err) {
    if (isEncryptedPdfError(err)) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }
    throw new Error(
      `Could not open "${fileItem.name}". Please ensure it is a valid, unencrypted PDF.`
    );
  }

  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const targetZeroBasedIndices =
    options.pageSelection === 'range'
      ? parsePageRange(options.pageRange, totalPages)
      : Array.from({ length: totalPages }, (_, i) => i);

  const { doc: pdfJsDoc, cleanup } = await openUnencryptedPdfJsDocument(buffer);

  let worker: any = null;
  let activePageStatusIndex = 0;
  const pageCountToProcess = targetZeroBasedIndices.length;

  try {
    const pageResults: OcrPageResult[] = [];
    const totalProgressSteps = Math.max(1, pageCountToProcess * 100);

    for (let idx = 0; idx < pageCountToProcess; idx++) {
      throwIfAborted(signal);
      activePageStatusIndex = idx;
      const pageNumber = targetZeroBasedIndices[idx] + 1;
      const { safeScale, widthPt, heightPt } = await computeSafeScale(
        pdfJsDoc,
        pageNumber,
        options.scale || 1.5
      );

      // Step 1: In hybrid mode, check if page already contains a clean digital text layer
      if (options.mode === 'hybrid') {
        const embeddedText = await readEmbeddedPageText(pdfJsDoc, pageNumber);
        const nonWhitespaceCount = embeddedText.replace(/\s+/g, '').length;
        if (nonWhitespaceCount >= MIN_EMBEDDED_TEXT_CHARS) {
          pageResults.push({
            pageNumber,
            source: 'embedded-text',
            text: embeddedText,
            confidence: null,
            wordCount: countWords(embeddedText),
            characterCount: embeddedText.length,
            words: [],
            widthPt,
            heightPt,
          });
          onProgress?.(
            Math.round(((idx + 1) * 100 * 90) / totalProgressSteps),
            100,
            `Extracted existing digital text on page ${pageNumber} (${idx + 1} of ${pageCountToProcess})...`
          );
          continue;
        }
      }

      // Step 2: Run OCR on rasterized page
      let recognized: CustomOcrRecognizeResult;
      if (customRecognizePage) {
        recognized = await customRecognizePage(
          pageNumber,
          options.language,
          safeScale,
          pdfJsDoc
        );
      } else {
        if (!worker) {
          onProgress?.(
            Math.round((idx * 100 * 90) / totalProgressSteps),
            100,
            `Loading lightweight OCR engine (${options.language})...`
          );

          const tesseractModule = await import('tesseract.js');
          throwIfAborted(signal);

          const workerUrl =
            typeof window !== 'undefined'
              ? new URL('/tesseract/worker.min.js', window.location.origin).href
              : undefined;

          worker = await tesseractModule.createWorker(
            options.language,
            tesseractModule.OEM.LSTM_ONLY,
            {
              ...(workerUrl ? { workerPath: workerUrl, workerBlobURL: false } : {}),
              logger: (m: any) => {
                if (signal?.aborted) return;
                if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
                  const overall = Math.round(
                    ((activePageStatusIndex * 100 + m.progress * 100) * 90) /
                      totalProgressSteps
                  );
                  onProgress?.(
                    Math.min(92, overall),
                    100,
                    `Recognizing text on page ${targetZeroBasedIndices[activePageStatusIndex] + 1} (${Math.round(
                      m.progress * 100
                    )}%)...`
                  );
                } else if (m?.status === 'loading language traineddata') {
                  onProgress?.(
                    Math.max(4, Math.round((activePageStatusIndex * 100 * 90) / totalProgressSteps)),
                    100,
                    `Preparing "${options.language}" OCR dictionary (cached locally after first run)...`
                  );
                }
              },
            }
          );
        }

        throwIfAborted(signal);
        onProgress?.(
          Math.round((idx * 100 * 90) / totalProgressSteps),
          100,
          `Rendering page ${pageNumber} of ${totalPages} for OCR...`
        );

        const canvas = await renderPdfPageToCanvas(pdfJsDoc, pageNumber, safeScale);
        try {
          throwIfAborted(signal);
          const result = await worker.recognize(
            canvas,
            {},
            { text: true, blocks: true }
          );
          const data = result?.data;
          const cleanText = (data?.text || '').trim();
          const words = extractWordsFromTesseractPage(data, canvas.width, canvas.height);
          recognized = {
            text: cleanText,
            confidence:
              typeof data?.confidence === 'number' && Number.isFinite(data.confidence)
                ? Math.round(data.confidence)
                : null,
            words,
          };
        } finally {
          // Immediately free raster buffer from device RAM
          canvas.width = 0;
          canvas.height = 0;
        }
      }

      pageResults.push({
        pageNumber,
        source: 'ocr',
        text: recognized.text,
        confidence: recognized.confidence,
        wordCount: countWords(recognized.text),
        characterCount: recognized.text.length,
        words: recognized.words,
        widthPt,
        heightPt,
      });

      onProgress?.(
        Math.round(((idx + 1) * 100 * 90) / totalProgressSteps),
        100,
        `Completed page ${pageNumber} (${idx + 1} of ${pageCountToProcess})`
      );
    }

    throwIfAborted(signal);
    onProgress?.(94, 100, 'Embedding invisible searchable text layer into output PDF...');

    // Step 3: Build searchable PDF preserving original visual appearance of all processed pages
    const fonts = await embedMultilingualPdfFonts(srcDoc);
    const ocrResultByPage = new Map<number, OcrPageResult>(
      pageResults.map((p) => [p.pageNumber, p])
    );

    const pdfPages = srcDoc.getPages();
    for (let i = 0; i < pdfPages.length; i++) {
      const pageNum = i + 1;
      const pageRes = ocrResultByPage.get(pageNum);
      if (!pageRes || pageRes.source !== 'ocr') continue;

      const pdfPage = pdfPages[i];
      const cropBox = pdfPage.getCropBox();
      const boxWidth = Math.max(36, cropBox.width || pageRes.widthPt);
      const boxHeight = Math.max(36, cropBox.height || pageRes.heightPt);

      if (pageRes.words.length > 0) {
        for (const w of pageRes.words) {
          const visual = shapeLogicalLineForPdf(w.text, 'auto', fonts);
          if (!visual) continue;

          const rawSize = w.heightPct * boxHeight * 0.85;
          const fontSize = Math.max(5, Math.min(44, rawSize || 10));
          const drawX = Math.max(
            cropBox.x,
            Math.min(cropBox.x + boxWidth - 8, cropBox.x + w.xPct * boxWidth)
          );
          const drawY = Math.max(
            cropBox.y + 4,
            Math.min(
              cropBox.y + boxHeight - fontSize,
              cropBox.y + boxHeight * (1 - (w.yPct + w.heightPct))
            )
          );

          drawVisualPdfLine(pdfPage, visual, fonts, {
            x: drawX,
            y: drawY,
            size: fontSize,
            color: rgb(0, 0, 0),
            opacity: 0, // Invisible searchable text layer
          });
        }
      } else if (pageRes.text.trim()) {
        // Fallback line placement when recognizer yields plain text without word boxes
        const lines = pageRes.text.split(/\r?\n/).slice(0, 65);
        let cursorY = cropBox.y + boxHeight - 36;
        for (const lineText of lines) {
          const visual = shapeLogicalLineForPdf(lineText.trim(), 'auto', fonts);
          if (visual && cursorY > cropBox.y + 18) {
            drawVisualPdfLine(pdfPage, visual, fonts, {
              x: cropBox.x + 28,
              y: cursorY,
              size: 9,
              color: rgb(0, 0, 0),
              opacity: 0,
            });
          }
          cursorY -= 12;
        }
      }
    }

    srcDoc.setProducer('PDFQuick Client-Side OCR Engine (Tesseract.js)');
    srcDoc.setCreator('PDFQuick');

    const pdfBytes = await srcDoc.save();
    const searchablePdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    const baseName = fileItem.name.replace(/\.pdf$/i, '') || 'document';
    const combinedText = pageResults
      .map((p) => `--- Page ${p.pageNumber} (${p.source === 'ocr' ? 'OCR' : 'Embedded Text'}) ---\n${p.text}`)
      .join('\n\n')
      .trim();

    const ocrConfidences = pageResults
      .map((p) => p.confidence)
      .filter((c): c is number => typeof c === 'number' && Number.isFinite(c));
    const averageConfidence =
      ocrConfidences.length > 0
        ? Math.round(ocrConfidences.reduce((a, b) => a + b, 0) / ocrConfidences.length)
        : null;

    const ocrPageCount = pageResults.filter((p) => p.source === 'ocr').length;
    const embeddedTextPageCount = pageResults.filter((p) => p.source === 'embedded-text').length;
    const totalWords = pageResults.reduce((sum, p) => sum + p.wordCount, 0);
    const totalCharacters = pageResults.reduce((sum, p) => sum + p.characterCount, 0);

    onProgress?.(100, 100, 'OCR complete. Searchable PDF and text ready.');

    return {
      pages: pageResults,
      combinedText,
      searchablePdfBlob,
      searchablePdfFilename: `${baseName}-ocr-searchable.pdf`,
      textFilename: `${baseName}-ocr-text.txt`,
      totalProcessedPages: pageResults.length,
      ocrPageCount,
      embeddedTextPageCount,
      averageConfidence,
      totalWords,
      totalCharacters,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore worker termination cleanup errors
      }
      worker = null;
    }
    await cleanup();
  }
}
