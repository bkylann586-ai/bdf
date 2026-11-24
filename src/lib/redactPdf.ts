import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { ProcessingFile } from '../types';
import {
  ENCRYPTED_PDF_ERROR_MESSAGE,
  MAX_CANVAS_PIXELS,
  isEncryptedPdfError,
  loadUnencryptedPdf,
  openUnencryptedPdfJsDocument,
  readFileAsArrayBuffer,
  releaseCanvasMemory,
  renderPdfPageToCanvas,
} from './pdfUtils';

export interface RedactionRect {
  id: string;
  pageNumber: number; // 1-based page index
  x: number; // normalized 0..1 from left
  y: number; // normalized 0..1 from top
  width: number; // normalized 0..1
  height: number; // normalized 0..1
  label?: string;
}

export type RedactionFlattenMode = 'targeted' | 'deep-flatten-all';

export interface PdfPrivacyInspection {
  pageCount: number;
  hasXmpMetadata: boolean;
  infoFieldsPresent: string[];
  annotationCount: number;
  hasAcroForm: boolean;
  hasHiddenLayersOcg: boolean;
  hasEmbeddedFilesOrNames: boolean;
  hasScriptsOrActions: boolean;
  pageSizes: { pageNumber: number; widthPt: number; heightPt: number; isLikelyScanned: boolean }[];
}

export type RedactionGuaranteeLevel =
  | 'destructive-all-pages'
  | 'destructive-redacted-pages-only'
  | 'metadata-only';

export interface RedactionAuditSummary {
  outputPageCount: number;
  inputPageCount: number;
  redactedPageNumbers: number[];
  unredactedPageNumbers: number[];
  redactionBoxCount: number;
  hasXmpMetadataAfter: boolean;
  remainingInfoKeys: string[];
  annotationsStripped: number;
  residualAnnotationCount: number;
  residualStructuralKeys: string[];
  textCountOnRedactedPages: number;
  isFullyVerified: boolean;
  guaranteeLevel: RedactionGuaranteeLevel;
  warnings: string[];
}

export interface RedactPdfResult {
  blob: Blob;
  downloadName: string;
  fileSize: number;
  originalSize: number;
  pageCount: number;
  message: string;
  audit: RedactionAuditSummary;
}

export type CustomPageRasterizer = (
  pdfJsDoc: any,
  pageNumber: number,
  widthPt: number,
  heightPt: number,
  pageRects: RedactionRect[],
  dpiScale: number
) => Promise<{ bytes: Uint8Array; format: 'png' | 'jpeg' }>;

export interface ApplyPrivacyRedactionOptions {
  regions: RedactionRect[];
  mode: RedactionFlattenMode;
  scrubMetadata?: boolean;
  dpiScale?: number;
  stampRedactedLabel?: boolean;
  onProgress?: (current: number, total: number, message: string) => void;
  /** Optional dependency injection for headless Node tests where HTML5 Canvas is unavailable */
  customRasterizer?: CustomPageRasterizer;
}


function clampNormalizedRect(rect: RedactionRect): RedactionRect | null {
  const x1 = Math.max(0, Math.min(1, rect.x));
  const y1 = Math.max(0, Math.min(1, rect.y));
  const x2 = Math.max(0, Math.min(1, rect.x + rect.width));
  const y2 = Math.max(0, Math.min(1, rect.y + rect.height));
  const width = x2 - x1;
  const height = y2 - y1;
  if (width <= 0.002 || height <= 0.002) {
    return null;
  }
  return {
    ...rect,
    x: x1,
    y: y1,
    width,
    height,
  };
}

/**
 * Strip catalog XMP metadata, Info trailer keys, and hidden structure dictionaries from a fresh PDFDocument.
 */
export function scrubPdfCatalogAndInfo(doc: PDFDocument): void {
  const catalog = doc.catalog;
  catalog.delete(PDFName.of('Metadata'));
  catalog.delete(PDFName.of('PieceInfo'));
  catalog.delete(PDFName.of('AcroForm'));
  catalog.delete(PDFName.of('OCProperties'));
  catalog.delete(PDFName.of('Names'));
  catalog.delete(PDFName.of('OpenAction'));
  catalog.delete(PDFName.of('AA'));
  catalog.delete(PDFName.of('JavaScript'));
  catalog.delete(PDFName.of('StructTreeRoot'));

  // Remove /Info dictionary completely from trailer so Author/Title/Creator/Subject/Keywords/Dates vanish
  const trailerInfo = (doc.context as any).trailerInfo;
  if (trailerInfo?.Info) {
    try {
      doc.context.delete(trailerInfo.Info);
    } catch {
      // ignore if indirect ref missing
    }
    delete trailerInfo.Info;
  }

  for (const page of doc.getPages()) {
    page.node.delete(PDFName.of('Metadata'));
    page.node.delete(PDFName.of('PieceInfo'));
    page.node.delete(PDFName.of('Annots'));
    page.node.delete(PDFName.of('AA'));
  }
}

/**
 * Inspect PDF document for metadata, XMP streams, annotations, hidden layers, and scanned vs vector pages.
 */
export async function inspectPdfForPrivacy(file: File | ArrayBuffer): Promise<PdfPrivacyInspection> {
  const buffer = file instanceof ArrayBuffer ? file : await readFileAsArrayBuffer(file);
  const srcDoc = await loadUnencryptedPdf(buffer, { updateMetadata: false });
  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const catalog = srcDoc.catalog;
  const hasXmpMetadata = catalog.has(PDFName.of('Metadata'));
  const hasAcroForm = catalog.has(PDFName.of('AcroForm'));
  const hasHiddenLayersOcg = catalog.has(PDFName.of('OCProperties'));
  const hasEmbeddedFilesOrNames = catalog.has(PDFName.of('Names'));
  const hasScriptsOrActions =
    catalog.has(PDFName.of('OpenAction')) ||
    catalog.has(PDFName.of('AA')) ||
    catalog.has(PDFName.of('JavaScript'));

  const infoFieldsPresent: string[] = [];
  const candidates: Array<[string, string | undefined]> = [
    ['Title', srcDoc.getTitle()],
    ['Author', srcDoc.getAuthor()],
    ['Subject', srcDoc.getSubject()],
    ['Keywords', srcDoc.getKeywords()],
    ['Creator', srcDoc.getCreator()],
    ['Producer', srcDoc.getProducer()],
  ];
  for (const [label, val] of candidates) {
    if (val && val.trim()) {
      infoFieldsPresent.push(label);
    }
  }
  const trailerInfoRef = (srcDoc.context as any).trailerInfo?.Info;
  if (trailerInfoRef) {
    const infoDict = srcDoc.context.lookup(trailerInfoRef);
    if (infoDict instanceof PDFDict) {
      if (infoDict.has(PDFName.of('CreationDate'))) infoFieldsPresent.push('CreationDate');
      if (infoDict.has(PDFName.of('ModDate'))) infoFieldsPresent.push('ModDate');
    }
  }

  let annotationCount = 0;
  const pages = srcDoc.getPages();
  const { doc: pdfJsDoc, cleanup } = await openUnencryptedPdfJsDocument(buffer);
  const pageSizes: PdfPrivacyInspection['pageSizes'] = [];

  try {
    for (let i = 0; i < totalPages; i++) {
      const pNode = pages[i].node;
      const annots = pNode.get(PDFName.of('Annots'));
      if (annots) {
        const lookedUp = srcDoc.context.lookup(annots);
        if (lookedUp && typeof (lookedUp as any).size === 'function') {
          annotationCount += (lookedUp as any).size();
        } else {
          annotationCount += 1;
        }
      }

      const cropBox = pages[i].getCropBox();
      const jsPage = await pdfJsDoc.getPage(i + 1);
      let isLikelyScanned = false;
      try {
        const textContent = await jsPage.getTextContent();
        const nonEmptyTextItems = (textContent?.items || []).filter(
          (it: any) => typeof it.str === 'string' && it.str.trim().length > 0
        );
        isLikelyScanned = nonEmptyTextItems.length === 0;
      } finally {
        jsPage.cleanup?.();
      }

      pageSizes.push({
        pageNumber: i + 1,
        widthPt: cropBox.width,
        heightPt: cropBox.height,
        isLikelyScanned,
      });
    }
  } finally {
    await cleanup();
  }

  return {
    pageCount: totalPages,
    hasXmpMetadata,
    infoFieldsPresent: Array.from(new Set(infoFieldsPresent)),
    annotationCount,
    hasAcroForm,
    hasHiddenLayersOcg,
    hasEmbeddedFilesOrNames,
    hasScriptsOrActions,
    pageSizes,
  };
}

/**
 * Search extractable text on a PDF.js page and compute normalized redaction boxes around matches.
 */
export async function findTextMatchesOnPage(
  pdfJsDoc: any,
  pageNumber: number,
  query: string
): Promise<RedactionRect[]> {
  const needle = query.trim().toLowerCase();
  if (!needle || needle.length < 2) return [];

  const page = await pdfJsDoc.getPage(pageNumber);
  try {
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const matches: RedactionRect[] = [];

    const { pdfjsLib } = await import('./pdfWorker');
    for (let idx = 0; idx < (textContent?.items || []).length; idx++) {
      const item: any = textContent.items[idx];
      if (!item || typeof item.str !== 'string') continue;
      const hay = item.str.toLowerCase();
      if (!hay.includes(needle)) continue;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const itemHeight = Math.max(10, Math.hypot(tx[2], tx[3]) || item.height || 12);
      const itemWidth = Math.max(12, item.width || needle.length * (itemHeight * 0.55));
      const padX = 3;
      const padY = 3;

      const leftPx = tx[4] - padX;
      const topPx = tx[5] - itemHeight - padY;
      const widthPx = itemWidth + padX * 2;
      const heightPx = itemHeight + padY * 2;

      const normalized = clampNormalizedRect({
        id: `match-${pageNumber}-${idx}-${Date.now()}`,
        pageNumber,
        x: leftPx / viewport.width,
        y: topPx / viewport.height,
        width: widthPx / viewport.width,
        height: heightPx / viewport.height,
        label: item.str.trim().slice(0, 36),
      });
      if (normalized) {
        matches.push(normalized);
      }
    }

    return matches;
  } finally {
    page.cleanup?.();
  }
}

async function defaultBrowserRasterizePage(
  pdfJsDoc: any,
  pageNumber: number,
  widthPt: number,
  heightPt: number,
  pageRects: RedactionRect[],
  requestedScale: number,
  stampRedactedLabel: boolean
): Promise<{ bytes: Uint8Array; format: 'png' | 'jpeg' }> {
  // Clamp scale so huge engineering pages don't overflow 14MP browser canvas cap
  const baseArea = Math.max(1, widthPt * heightPt);
  const maxSafeScale = Math.sqrt(MAX_CANVAS_PIXELS / baseArea);
  const effectiveScale = Math.max(1.0, Math.min(requestedScale, maxSafeScale));

  const canvas = await renderPdfPageToCanvas(pdfJsDoc, pageNumber, effectiveScale);
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not acquire 2D canvas context for destructive redaction.');
    }

    // Overwrite pixel buffer strictly over every marked redaction region
    for (const rect of pageRects) {
      const rx = Math.max(0, Math.floor(rect.x * canvas.width) - 2);
      const ry = Math.max(0, Math.floor(rect.y * canvas.height) - 2);
      const rw = Math.min(canvas.width - rx, Math.ceil(rect.width * canvas.width) + 4);
      const rh = Math.min(canvas.height - ry, Math.ceil(rect.height * canvas.height) + 4);

      if (rw <= 0 || rh <= 0) continue;

      // Clear underlying RGBA bytes first, then fill solid opaque black
      ctx.clearRect(rx, ry, rw, rh);
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx, ry, rw, rh);

      if (stampRedactedLabel && rw >= 64 && rh >= 18) {
        ctx.fillStyle = '#FFFFFF';
        const fontPx = Math.max(9, Math.min(14, Math.floor(rh * 0.45)));
        ctx.font = `bold ${fontPx}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('REDACTED', rx + rw / 2, ry + rh / 2);
      }
    }

    // Export clean JPEG at high print quality (or PNG when tiny) without copying source streams
    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to flatten redacted page image'))),
        'image/jpeg',
        0.92
      );
    });

    const buf = await jpegBlob.arrayBuffer();
    return {
      bytes: new Uint8Array(buf),
      format: 'jpeg',
    };
  } finally {
    releaseCanvasMemory(canvas);
  }
}

/**
 * Rebuild a clean PDF with destructive region removal and metadata/XMP scrubbing,
 * followed by automated post-export verification.
 */
export async function applyPrivacyRedaction(
  fileItem: ProcessingFile,
  options: ApplyPrivacyRedactionOptions
): Promise<RedactPdfResult> {
  const {
    regions,
    mode,
    scrubMetadata = true,
    dpiScale = 2.0,
    stampRedactedLabel = true,
    onProgress,
    customRasterizer,
  } = options;

  const buffer = await readFileAsArrayBuffer(fileItem.file);
  let srcDoc: PDFDocument;
  try {
    srcDoc = await loadUnencryptedPdf(buffer, { updateMetadata: false });
  } catch (err) {
    if (isEncryptedPdfError(err)) {
      throw new Error(ENCRYPTED_PDF_ERROR_MESSAGE);
    }
    throw new Error(
      `Cannot read "${fileItem.name}". Ensure it is a valid, non-corrupted, unencrypted PDF.`
    );
  }

  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  const catalog = srcDoc.catalog;
  const srcHadHiddenLayers = catalog.has(PDFName.of('OCProperties'));
  const srcHadAcroForm = catalog.has(PDFName.of('AcroForm'));
  const srcHadNamesOrScripts =
    catalog.has(PDFName.of('Names')) ||
    catalog.has(PDFName.of('OpenAction')) ||
    catalog.has(PDFName.of('JavaScript'));

  let annotationsFound = 0;
  for (const p of srcDoc.getPages()) {
    const annots = p.node.get(PDFName.of('Annots'));
    if (annots) {
      const looked = srcDoc.context.lookup(annots);
      annotationsFound +=
        looked && typeof (looked as any).size === 'function' ? (looked as any).size() : 1;
    }
  }

  const validRegions: RedactionRect[] = [];
  for (const r of regions) {
    if (r.pageNumber < 1 || r.pageNumber > totalPages) continue;
    const clamped = clampNormalizedRect(r);
    if (clamped) validRegions.push(clamped);
  }

  const regionsByPage = new Map<number, RedactionRect[]>();
  for (const r of validRegions) {
    const existing = regionsByPage.get(r.pageNumber) || [];
    existing.push(r);
    regionsByPage.set(r.pageNumber, existing);
  }

  const outDoc = await PDFDocument.create();
  const { doc: pdfJsDoc, cleanup } = await openUnencryptedPdfJsDocument(buffer);

  const redactedPageNumbers: number[] = [];
  const unredactedPageNumbers: number[] = [];

  try {
    const srcPages = srcDoc.getPages();
    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      const pageRects = regionsByPage.get(pageNumber) || [];
      const shouldRasterize = mode === 'deep-flatten-all' || pageRects.length > 0;

      if (onProgress) {
        onProgress(
          pageNumber,
          totalPages,
          shouldRasterize
            ? `Destructively flattening page ${pageNumber} of ${totalPages}...`
            : `Sanitizing unredacted page ${pageNumber} of ${totalPages}...`
        );
      }

      const cropBox = srcPages[i].getCropBox();
      const widthPt = Math.max(36, cropBox.width || 612);
      const heightPt = Math.max(36, cropBox.height || 792);

      if (shouldRasterize) {
        const rasterResult = customRasterizer
          ? await customRasterizer(pdfJsDoc, pageNumber, widthPt, heightPt, pageRects, dpiScale)
          : await defaultBrowserRasterizePage(
              pdfJsDoc,
              pageNumber,
              widthPt,
              heightPt,
              pageRects,
              dpiScale,
              stampRedactedLabel
            );

        const embedded =
          rasterResult.format === 'png'
            ? await outDoc.embedPng(rasterResult.bytes)
            : await outDoc.embedJpg(rasterResult.bytes);

        const newPage = outDoc.addPage([widthPt, heightPt]);
        newPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: widthPt,
          height: heightPt,
        });

        if (pageRects.length > 0) {
          redactedPageNumbers.push(pageNumber);
        } else {
          unredactedPageNumbers.push(pageNumber);
        }
      } else {
        const [copied] = await outDoc.copyPages(srcDoc, [i]);
        copied.node.delete(PDFName.of('Annots'));
        copied.node.delete(PDFName.of('Metadata'));
        copied.node.delete(PDFName.of('PieceInfo'));
        copied.node.delete(PDFName.of('AA'));
        outDoc.addPage(copied);
        unredactedPageNumbers.push(pageNumber);
      }
    }
  } finally {
    await cleanup();
  }

  if (scrubMetadata) {
    scrubPdfCatalogAndInfo(outDoc);
  } else {
    outDoc.setProducer('PDFQuick Privacy Engine');
  }

  const outBytes = await outDoc.save({ useObjectStreams: false });

  // Post-export verification pass on synthesized PDF
  const verifyDoc = await PDFDocument.load(outBytes, { updateMetadata: false });
  const hasXmpMetadataAfter = verifyDoc.catalog.has(PDFName.of('Metadata'));
  const remainingInfoKeys: string[] = [];
  const checkFields: Array<[string, string | undefined]> = [
    ['Title', verifyDoc.getTitle()],
    ['Author', verifyDoc.getAuthor()],
    ['Subject', verifyDoc.getSubject()],
    ['Keywords', verifyDoc.getKeywords()],
    ['Creator', verifyDoc.getCreator()],
    ['Producer', verifyDoc.getProducer()],
  ];
  for (const [k, v] of checkFields) {
    if (v && v.trim()) remainingInfoKeys.push(k);
  }

  const residualStructuralKeys: string[] = [];
  for (const keyName of [
    'AcroForm',
    'OCProperties',
    'Names',
    'OpenAction',
    'AA',
    'JavaScript',
    'PieceInfo',
  ]) {
    if (verifyDoc.catalog.has(PDFName.of(keyName))) {
      residualStructuralKeys.push(keyName);
    }
  }

  let residualAnnotationCount = 0;
  for (const verifyPage of verifyDoc.getPages()) {
    const annots = verifyPage.node.get(PDFName.of('Annots'));
    if (annots) {
      const looked = verifyDoc.context.lookup(annots);
      residualAnnotationCount +=
        looked && typeof (looked as any).size === 'function' ? (looked as any).size() : 1;
    }
  }

  let textCountOnRedactedPages = 0;
  const pagesToCheckText =
    mode === 'deep-flatten-all'
      ? Array.from({ length: verifyDoc.getPageCount() }, (_, i) => i + 1)
      : redactedPageNumbers;

  const { doc: verifyJsDoc, cleanup: verifyCleanup } = await openUnencryptedPdfJsDocument(
    new Uint8Array(outBytes).buffer
  );
  try {
    for (const rPageNum of pagesToCheckText) {
      const p = await verifyJsDoc.getPage(rPageNum);
      try {
        const tc = await p.getTextContent();
        const nonEmpty = (tc?.items || []).filter(
          (it: any) => typeof it.str === 'string' && it.str.trim().length > 0
        );
        textCountOnRedactedPages += nonEmpty.length;
      } finally {
        p.cleanup?.();
      }
    }
  } finally {
    await verifyCleanup();
  }

  const warnings: string[] = [];
  let guaranteeLevel: RedactionAuditSummary['guaranteeLevel'];

  if (!scrubMetadata) {
    warnings.push(
      'Metadata/XMP scrubbing was unchecked by user settings. Author, Title, Producer, or XMP fields may remain in the exported file.'
    );
  }

  if (validRegions.length === 0 && mode !== 'deep-flatten-all') {
    guaranteeLevel = 'metadata-only';
    warnings.push(
      'No redaction regions were marked on any page. Document body content remains intact (only metadata, XMP, annotations, and catalog extras were removed).'
    );
  } else if (mode === 'deep-flatten-all') {
    guaranteeLevel = 'destructive-all-pages';
    if (validRegions.length === 0) {
      warnings.push(
        scrubMetadata
          ? 'All pages were flattened to clean images and metadata/XMP were removed, though no specific blackout regions were marked.'
          : 'All pages were flattened to clean images without blackout boxes, and Metadata/XMP scrubbing was unchecked.'
      );
    }
  } else {
    guaranteeLevel = 'destructive-redacted-pages-only';
    if (unredactedPageNumbers.length > 0) {
      warnings.push(
        `Pages without redaction boxes (${unredactedPageNumbers.join(', ')}) kept original PDF streams with annotations/metadata removed. Switch to "Deep-Flatten All Pages" if hidden text, OCR layers, or OCG layers may exist on untouched pages.`
      );
    }
    if (srcHadHiddenLayers || srcHadAcroForm) {
      warnings.push(
        'The source file contained Optional Content Layers (OCG) or AcroForm structures. Catalog links were stripped, and we recommend enabling "Deep-Flatten All Pages" to guarantee zero layer fragments survive on unredacted pages.'
      );
    }
  }

  if (srcHadNamesOrScripts) {
    warnings.push(
      'Embedded file trees, open actions, or scripts detected in the original catalog were excluded from the rebuilt output PDF.'
    );
  }

  if (textCountOnRedactedPages > 0) {
    warnings.push(
      `Verification detected ${textCountOnRedactedPages} residual extractable text items on flattened pages. Re-check or re-run Deep-Flatten.`
    );
  }

  const isFullyVerified =
    guaranteeLevel === 'destructive-all-pages' &&
    validRegions.length > 0 &&
    textCountOnRedactedPages === 0 &&
    !hasXmpMetadataAfter &&
    remainingInfoKeys.length === 0 &&
    residualAnnotationCount === 0 &&
    residualStructuralKeys.length === 0;

  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
  const audit: RedactionAuditSummary = {
    outputPageCount: verifyDoc.getPageCount(),
    inputPageCount: totalPages,
    redactedPageNumbers,
    unredactedPageNumbers,
    redactionBoxCount: validRegions.length,
    hasXmpMetadataAfter,
    remainingInfoKeys,
    annotationsStripped: annotationsFound,
    residualAnnotationCount,
    residualStructuralKeys,
    textCountOnRedactedPages,
    isFullyVerified,
    guaranteeLevel,
    warnings,
  };

  return {
    blob,
    downloadName: `${baseName}-redacted-private.pdf`,
    fileSize: blob.size,
    originalSize: fileItem.size,
    pageCount: audit.outputPageCount,
    message:
      validRegions.length > 0
        ? `Permanently flattened ${redactedPageNumbers.length} redacted page(s) (${validRegions.length} region${validRegions.length > 1 ? 's' : ''}) and scrubbed ${remainingInfoKeys.length === 0 && !hasXmpMetadataAfter ? 'all Info & XMP metadata' : 'catalog structures'}.`
        : `Rebuilt clean ${audit.outputPageCount}-page PDF (${scrubMetadata ? 'metadata/XMP & structural tracking stripped' : 'metadata preserved per setting'}).`,
    audit,
  };
}
