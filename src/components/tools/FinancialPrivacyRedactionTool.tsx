import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Trash2,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Layers,
  FileText,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { ProcessingFile } from '../../types';
import {
  PdfPrivacyInspection,
  RedactPdfResult,
  RedactionFlattenMode,
  RedactionRect,
  applyPrivacyRedaction,
  findTextMatchesOnPage,
  inspectPdfForPrivacy,
} from '../../lib/redactPdf';
import {
  downloadBlob,
  formatBytes,
  openUnencryptedPdfJsDocument,
  readFileAsArrayBuffer,
  renderPdfPageToCanvas,
} from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { trackSampleUse, trackToolError, trackToolStart, trackToolSuccess } from '../../lib/analytics';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';

interface DragDraft {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const FinancialPrivacyRedactionTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();

  const [fileItem, setFileItem] = useState<ProcessingFile | null>(null);
  const [inspection, setInspection] = useState<PdfPrivacyInspection | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive page viewer & redaction regions
  const [currentPage, setCurrentPage] = useState(1);
  const [regions, setRegions] = useState<RedactionRect[]>([]);
  const [dragDraft, setDragDraft] = useState<DragDraft | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [isSearchingText, setIsSearchingText] = useState(false);

  // Processing options & output audit
  const [mode, setMode] = useState<RedactionFlattenMode>('targeted');
  const [scrubMetadata, setScrubMetadata] = useState(true);
  const [stampRedactedLabel, setStampRedactedLabel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 1, message: '' });
  const [result, setResult] = useState<RedactPdfResult | null>(null);

  // Before / After post-export comparison state
  const [comparePage, setComparePage] = useState(1);
  const [beforeTextCount, setBeforeTextCount] = useState<number | null>(null);
  const [afterTextCount, setAfterTextCount] = useState<number | null>(null);

  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLoadingFileRef = useRef(false);

  const cleanupCanvases = () => {
    [editorCanvasRef.current, beforeCanvasRef.current, afterCanvasRef.current].forEach((c) => {
      if (c) {
        c.width = 0;
        c.height = 0;
      }
    });
  };

  useEffect(() => {
    return () => {
      cleanupCanvases();
    };
  }, []);

  const currentPageRegions = useMemo(
    () => regions.filter((r) => r.pageNumber === currentPage),
    [regions, currentPage]
  );

  const currentPageMeta = useMemo(
    () => inspection?.pageSizes.find((p) => p.pageNumber === currentPage),
    [inspection, currentPage]
  );

  // Render active page preview in Editor whenever fileItem or currentPage changes
  useEffect(() => {
    let cancelled = false;
    const renderEditorPage = async () => {
      if (!fileItem || !inspection || result || typeof document === 'undefined') return;
      try {
        const buffer = await readFileAsArrayBuffer(fileItem.file);
        const { doc, cleanup } = await openUnencryptedPdfJsDocument(buffer);
        try {
          if (cancelled) return;
          const rendered = await renderPdfPageToCanvas(doc, currentPage, 1.35);
          if (!cancelled && editorCanvasRef.current) {
            const target = editorCanvasRef.current;
            target.width = rendered.width;
            target.height = rendered.height;
            const ctx = target.getContext('2d');
            if (ctx) {
              ctx.drawImage(rendered, 0, 0);
            }
          }
          rendered.width = 0;
          rendered.height = 0;
        } finally {
          await cleanup();
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Failed to render PDF page preview.');
        }
      }
    };

    renderEditorPage();
    return () => {
      cancelled = true;
    };
  }, [fileItem, inspection, currentPage, result]);

  // Render Before vs After comparison pages after export completes
  useEffect(() => {
    let cancelled = false;
    const renderComparison = async () => {
      if (!fileItem || !result || typeof document === 'undefined') return;
      try {
        const [beforeBuf, afterBuf] = await Promise.all([
          readFileAsArrayBuffer(fileItem.file),
          result.blob.arrayBuffer(),
        ]);

        const [beforeHandle, afterHandle] = await Promise.all([
          openUnencryptedPdfJsDocument(beforeBuf),
          openUnencryptedPdfJsDocument(afterBuf),
        ]);

        try {
          if (cancelled) return;
          const [beforeCanvas, afterCanvas, beforePageObj, afterPageObj] = await Promise.all([
            renderPdfPageToCanvas(beforeHandle.doc, comparePage, 1.1),
            renderPdfPageToCanvas(afterHandle.doc, comparePage, 1.1),
            beforeHandle.doc.getPage(comparePage),
            afterHandle.doc.getPage(comparePage),
          ]);

          const [beforeTc, afterTc] = await Promise.all([
            beforePageObj.getTextContent(),
            afterPageObj.getTextContent(),
          ]);
          beforePageObj.cleanup?.();
          afterPageObj.cleanup?.();

          if (!cancelled) {
            setBeforeTextCount(
              (beforeTc?.items || []).filter((it: any) => it.str?.trim()).length
            );
            setAfterTextCount(
              (afterTc?.items || []).filter((it: any) => it.str?.trim()).length
            );

            if (beforeCanvasRef.current) {
              beforeCanvasRef.current.width = beforeCanvas.width;
              beforeCanvasRef.current.height = beforeCanvas.height;
              beforeCanvasRef.current.getContext('2d')?.drawImage(beforeCanvas, 0, 0);
            }
            if (afterCanvasRef.current) {
              afterCanvasRef.current.width = afterCanvas.width;
              afterCanvasRef.current.height = afterCanvas.height;
              afterCanvasRef.current.getContext('2d')?.drawImage(afterCanvas, 0, 0);
            }
          }

          beforeCanvas.width = 0;
          beforeCanvas.height = 0;
          afterCanvas.width = 0;
          afterCanvas.height = 0;
        } finally {
          await Promise.all([beforeHandle.cleanup(), afterHandle.cleanup()]);
        }
      } catch (err) {
        console.warn('Comparison render warning:', err);
      }
    };

    renderComparison();
    return () => {
      cancelled = true;
    };
  }, [fileItem, result, comparePage]);

  const loadPdfFile = async (file: File) => {
    setErrorMsg(null);
    setResult(null);
    setInspection(null);
    setRegions([]);
    setSearchNotice(null);
    setCurrentPage(1);
    setComparePage(1);
    setInspecting(true);

    try {
      const info = await inspectPdfForPrivacy(file);
      setFileItem({
        id: `${file.name}-${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        pageCount: info.pageCount,
      });
      setInspection(info);
    } catch (err: any) {
      setFileItem(null);
      setErrorMsg(err?.message || 'Could not load PDF file. It may be encrypted or corrupted.');
    } finally {
      setInspecting(false);
    }
  };

  const handleFilesSelected = async (incomingFiles: File[]) => {
    if (isLoadingFileRef.current || inspecting || isProcessing || result) return;
    if (!incomingFiles || incomingFiles.length === 0) return;

    isLoadingFileRef.current = true;
    setErrorMsg(null);
    try {
      const validation = await validateSelectedFiles(incomingFiles, {
        accept: 'application/pdf,.pdf',
        multiple: false,
      });

      if (validation.errorMessage) {
        setErrorMsg(validation.errorMessage);
      }

      if (validation.validFiles.length === 0) {
        return;
      }

      await loadPdfFile(validation.validFiles[0]);
    } finally {
      isLoadingFileRef.current = false;
    }
  };

  useEffect(() => {
    const canAcceptDrop = !inspecting && !isProcessing && !result;
    return registerDropHandler(
      (dropped) => {
        void handleFilesSelected(dropped);
      },
      t('banking.privacyTitle'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, inspecting, isProcessing, result]);

  const handleLoadSampleStatement = async () => {
    trackSampleUse('financial-document-privacy');
    const doc = await PDFDocument.create();
    doc.setTitle('Sample Statement With Private Metadata');
    doc.setAuthor('Sample Account Holder');
    doc.setSubject('Checking Statement Account #0000-4829');
    doc.setKeywords(['account-4829', 'sample-routing']);

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    const p1 = doc.addPage([612, 792]);
    p1.drawText('SAMPLE FINANCIAL STATEMENT (NON-REAL DEMO)', { x: 50, y: 740, size: 14, font: bold, color: rgb(0.1, 0.2, 0.4) });
    p1.drawText('Account Holder: Jordan M. Taylor', { x: 50, y: 700, size: 11, font });
    p1.drawText('Account Reference: XXXX-XXXX-4829', { x: 50, y: 680, size: 11, font });
    p1.drawText('Mailing Address: 742 Maple Crest Ave, Austin, TX 78704', { x: 50, y: 660, size: 11, font });
    p1.drawText('Statement Period: October 1 - October 31, 2026', { x: 50, y: 625, size: 11, font: bold });
    p1.drawText('Opening Balance: $12,450.00   |   Ending Balance: $14,120.00', { x: 50, y: 600, size: 11, font });

    const p2 = doc.addPage([612, 792]);
    p2.drawText('PAGE 2 - TRANSACTION SUMMARY (PUBLIC COPY)', { x: 50, y: 740, size: 13, font: bold });
    p2.drawText('10/04/2026   Utility Bill Auto-Pay           -$142.50', { x: 50, y: 690, size: 10.5, font });
    p2.drawText('10/15/2026   Payroll Direct Deposit         +$3,250.00', { x: 50, y: 670, size: 10.5, font });
    p2.drawText('10/22/2026   Grocery Market Purchase         -$184.20', { x: 50, y: 650, size: 10.5, font });

    const bytes = await doc.save();
    const sampleFile = new File([bytes.buffer as ArrayBuffer], 'sample-financial-statement.pdf', {
      type: 'application/pdf',
    });
    await loadPdfFile(sampleFile);
  };

  // Pointer drawing handlers normalized to overlay bounding rect
  const getNormalizedCoords = (clientX: number, clientY: number) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    setDragDraft({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragDraft) return;
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    setDragDraft((prev) => (prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null));
  };

  const handlePointerUp = () => {
    if (!dragDraft) return;
    const x = Math.min(dragDraft.startX, dragDraft.currentX);
    const y = Math.min(dragDraft.startY, dragDraft.currentY);
    const width = Math.abs(dragDraft.currentX - dragDraft.startX);
    const height = Math.abs(dragDraft.currentY - dragDraft.startY);
    setDragDraft(null);

    if (width >= 0.012 && height >= 0.01) {
      setRegions((prev) => [
        ...prev,
        {
          id: `box-${currentPage}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pageNumber: currentPage,
          x,
          y,
          width,
          height,
          label: `Page ${currentPage} area`,
        },
      ]);
    }
  };

  const handleFindTextOnPage = async () => {
    if (!fileItem || !searchTerm.trim()) return;
    setSearchNotice(null);
    setIsSearchingText(true);
    try {
      const buffer = await readFileAsArrayBuffer(fileItem.file);
      const { doc, cleanup } = await openUnencryptedPdfJsDocument(buffer);
      try {
        const found = await findTextMatchesOnPage(doc, currentPage, searchTerm);
        if (found.length === 0) {
          setSearchNotice(
            currentPageMeta?.isLikelyScanned
              ? `Page ${currentPage} appears to be a scanned image (no text layer). Draw blackout boxes manually with your mouse/finger.`
              : `No selectable text matching "${searchTerm.trim()}" found on Page ${currentPage}.`
          );
        } else {
          setRegions((prev) => [...prev, ...found]);
          setSearchNotice(`Marked ${found.length} matching region(s) on Page ${currentPage}.`);
        }
      } finally {
        await cleanup();
      }
    } catch (err: any) {
      setSearchNotice(err?.message || 'Unable to scan text on this page.');
    } finally {
      setIsSearchingText(false);
    }
  };

  const handleApplyRedaction = async () => {
    if (!fileItem || !inspection) return;
    setErrorMsg(null);
    setIsProcessing(true);
    setProgress({ current: 0, total: inspection.pageCount, message: 'Preparing local redaction engine...' });
    const startedAt = Date.now();
    trackToolStart('financial-document-privacy');

    try {
      const redactOutput = await applyPrivacyRedaction(fileItem, {
        regions,
        mode,
        scrubMetadata,
        dpiScale: 2.0,
        stampRedactedLabel,
        onProgress: (current, total, message) => setProgress({ current, total, message }),
      });

      const firstRedactedPage = redactOutput.audit.redactedPageNumbers[0] || 1;
      setComparePage(firstRedactedPage);
      setResult(redactOutput);
      trackToolSuccess('financial-document-privacy', {
        durationMs: Date.now() - startedAt,
        pageCount: redactOutput.pageCount,
      });
    } catch (err: any) {
      const msg = err?.message || 'Redaction processing failed.';
      setErrorMsg(msg);
      trackToolError('financial-document-privacy', err?.name || 'RedactionError');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    cleanupCanvases();
    setFileItem(null);
    setInspection(null);
    setRegions([]);
    setResult(null);
    setErrorMsg(null);
    setSearchTerm('');
    setSearchNotice(null);
    setBeforeTextCount(null);
    setAfterTextCount(null);
  };

  if (isProcessing) {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('banking.privacyTitle')}
      />
    );
  }

  // Post-Processing Verification & Before/After Inspection Screen
  if (result && inspection) {
    const isFullVerified = result.audit.isFullyVerified;
    const isMetadataOnly =
      result.audit.guaranteeLevel === 'metadata-only' ||
      result.audit.textCountOnRedactedPages > 0 ||
      result.audit.redactionBoxCount === 0;

    return (
      <div className="space-y-6">
        {/* Guarantee Status Banner (Strictly honest about what was destroyed vs preserved) */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 ${
            isMetadataOnly
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : isFullVerified
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-[#EFF6FF] border-[#2563EB]/30 text-[#102A56]'
          }`}
        >
          <div className="flex items-start gap-3">
            {isMetadataOnly ? (
              <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 text-xs sm:text-sm">
              <h3 className="font-bold text-base">
                {result.audit.guaranteeLevel === 'metadata-only'
                  ? 'Metadata Scrubbed Only (No Content Redactions Marked)'
                  : isFullVerified
                    ? 'Destructive Redaction & Full-Document Sanitization Verified'
                    : result.audit.redactionBoxCount === 0
                      ? 'Document Flattened & Rebuilt (No Blackout Regions Marked)'
                      : 'Targeted Destructive Redaction Complete (Verify Warnings Below)'}
              </h3>
              <p>{result.message}</p>
              {result.audit.warnings.length > 0 && (
                <ul className="space-y-1 pt-2 border-t border-black/10 text-xs">
                  {result.audit.warnings.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Post-Export Audit Telemetry Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
          <h3 className="text-sm font-bold text-[#102A56] mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Post-Export Automated Security Verification</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <div className="text-[#64748B] mb-1">Pages Preserved</div>
              <div className="font-mono font-bold text-[#102A56] text-sm">
                {result.audit.outputPageCount} / {result.audit.inputPageCount}
              </div>
            </div>
            <div className="p-3.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <div className="text-[#64748B] mb-1">Redacted Regions</div>
              <div className="font-mono font-bold text-[#102A56] text-sm">
                {result.audit.redactionBoxCount}
              </div>
            </div>
            <div className="p-3.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <div className="text-[#64748B] mb-1">Text on Redacted Pages</div>
              <div
                className={`font-mono font-bold text-sm ${
                  result.audit.textCountOnRedactedPages === 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {result.audit.textCountOnRedactedPages} extractable
              </div>
            </div>
            <div className="p-3.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <div className="text-[#64748B] mb-1">XMP &amp; Info Metadata</div>
              <div
                className={`font-mono font-bold text-sm ${
                  !result.audit.hasXmpMetadataAfter && result.audit.remainingInfoKeys.length === 0
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {!result.audit.hasXmpMetadataAfter && result.audit.remainingInfoKeys.length === 0
                  ? '0 Remaining'
                  : `${result.audit.remainingInfoKeys.length} Info keys`}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
            <div className="text-xs text-[#64748B] font-mono">
              {result.downloadName} · {formatBytes(result.fileSize)} (Original: {formatBytes(result.originalSize)})
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => downloadBlob(result.blob, result.downloadName)}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Sanitized PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#17243A] bg-[#F4F7FB] hover:bg-[#E2E8F0]/70 border border-[#E2E8F0] rounded-xl cursor-pointer transition-colors"
              >
                <span>Edit Redaction Areas</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#64748B] hover:text-[#102A56] bg-white border border-[#E2E8F0] hover:bg-[#F4F7FB] rounded-xl cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Document</span>
              </button>
            </div>
          </div>

          <PerformanceMonitor
            variant="summary"
            inputBytes={result.originalSize}
            outputBytes={result.fileSize}
            className="mt-4"
          />
        </div>

        {/* Before vs After Visual & Text Layer Comparison */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#102A56] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#2563EB]" />
                <span>Before &amp; After Inspection Preview</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Verify visually and structurally that sensitive regions are gone before sharing.
              </p>
            </div>

            {result.audit.outputPageCount > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  disabled={comparePage <= 1}
                  onClick={() => setComparePage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F4F7FB] text-[#17243A] disabled:opacity-40 cursor-pointer"
                  aria-label="Previous comparison page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[#17243A]">
                  Page {comparePage} / {result.audit.outputPageCount}
                </span>
                <button
                  type="button"
                  disabled={comparePage >= result.audit.outputPageCount}
                  onClick={() => setComparePage((p) => Math.min(result.audit.outputPageCount, p + 1))}
                  className="p-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F4F7FB] text-[#17243A] disabled:opacity-40 cursor-pointer"
                  aria-label="Next comparison page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#17243A]">BEFORE (Original Page {comparePage})</span>
                <span className="font-mono text-[11px] text-[#64748B]">
                  {beforeTextCount !== null ? `${beforeTextCount} text runs` : '...'}
                </span>
              </div>
              <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-2 flex justify-center overflow-auto max-h-[460px]">
                <canvas ref={beforeCanvasRef} className="max-w-full h-auto bg-white shadow-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800">AFTER (Sanitized Page {comparePage})</span>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    afterTextCount === 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {afterTextCount !== null ? `${afterTextCount} selectable text runs` : '...'}
                </span>
              </div>
              <div className="bg-[#F4F7FB] border border-emerald-200 rounded-xl p-2 flex justify-center overflow-auto max-h-[460px]">
                <canvas ref={afterCanvasRef} className="max-w-full h-auto bg-white shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Anti-Fake-Redaction Security Warning */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-red-950 leading-relaxed">
          <p className="font-bold mb-1">
            True Destructive Pixel-Flattening + Metadata/XMP Scrubbing (Never Black-Box Overlays)
          </p>
          <p className="text-xs text-red-900">
            Unlike unsafe tools that merely layer black rectangles on top of selectable text, PDFQuick permanently clears redacted regions from rendered page pixels and discards underlying text streams, annotations, hidden OCG layers, Info fields, and XMP streams into a freshly rebuilt PDF catalog.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-2xl p-4 text-xs sm:text-sm text-red-900 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!fileItem || !inspection ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={false}
            disabled={inspecting}
            delegateValidation={true}
            helperText={
              inspecting
                ? 'Inspecting PDF structure, metadata, and page streams in browser memory...'
                : t('dropzone.helperSingle')
            }
            onFilesSelected={(files) => {
              void handleFilesSelected(files);
            }}
            onSampleRequested={handleLoadSampleStatement}
            sampleLabel="Try with a sample statement PDF (safe fake data + test metadata)"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Interactive Page Preview & Drag-to-Redact Canvas */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#102A56] text-[#38BDF8] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#102A56] truncate">
                    {fileItem.name}
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Drag across any sensitive text or number on Page {currentPage} to mark for permanent removal.
                    {currentPageMeta && (
                      <span className="ms-1.5 font-mono">
                        ({Math.round(currentPageMeta.widthPt)}×{Math.round(currentPageMeta.heightPt)} pt ·{' '}
                        {currentPageMeta.isLikelyScanned ? 'Image/Scanned Page' : 'Text-Layer Page'})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F4F7FB] text-[#17243A] disabled:opacity-40 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-[#17243A] px-1">
                  Page {currentPage} / {inspection.pageCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= inspection.pageCount}
                  onClick={() => setCurrentPage((p) => Math.min(inspection.pageCount, p + 1))}
                  className="p-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F4F7FB] text-[#17243A] disabled:opacity-40 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Text Search Auto-Locator Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find & auto-mark text on this page (e.g. 4829, address, name)..."
                  className="w-full min-h-[40px] ps-9 pe-3 py-2 text-xs bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                />
              </div>
              <button
                type="button"
                disabled={isSearchingText || searchTerm.trim().length < 2}
                onClick={handleFindTextOnPage}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#2563EB]/25 rounded-xl disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors"
              >
                {isSearchingText ? 'Scanning...' : 'Auto-Mark Text Matches'}
              </button>
            </div>

            {searchNotice && (
              <div className="text-xs text-[#17243A] bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl px-3 py-2">
                {searchNotice}
              </div>
            )}

            {/* Interactive Canvas + Normalized SVG/Box Redaction Layer */}
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-3 flex justify-center overflow-auto max-h-[650px]">
              <div className="relative inline-block select-none touch-none shadow-md bg-white">
                <canvas ref={editorCanvasRef} className="block max-w-full h-auto" />

                <div
                  ref={overlayRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => setDragDraft(null)}
                  className="absolute inset-0 cursor-crosshair"
                  aria-label="Drag to draw sensitive redaction regions"
                >
                  {currentPageRegions.map((box, idx) => (
                    <div
                      key={box.id}
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`,
                      }}
                      className="absolute bg-black/85 border-2 border-red-500 flex items-center justify-center group"
                    >
                      <span className="text-[10px] font-mono font-bold text-white px-1 truncate pointer-events-none">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRegions((prev) => prev.filter((item) => item.id !== box.id));
                        }}
                        aria-label={`Remove redaction box ${idx + 1}`}
                        className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {dragDraft && (
                    <div
                      style={{
                        left: `${Math.min(dragDraft.startX, dragDraft.currentX) * 100}%`,
                        top: `${Math.min(dragDraft.startY, dragDraft.currentY) * 100}%`,
                        width: `${Math.abs(dragDraft.currentX - dragDraft.startX) * 100}%`,
                        height: `${Math.abs(dragDraft.currentY - dragDraft.startY) * 100}%`,
                      }}
                      className="absolute bg-red-600/35 border-2 border-dashed border-red-600 pointer-events-none"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Pre-Scrubbing Diagnostics, Region List & Controls */}
          <div className="lg:col-span-4 space-y-5">
            {/* Detected Risks Panel */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A56]">
                  Detected Hidden Metadata
                </h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-medium text-[#64748B] hover:text-red-600 cursor-pointer"
                >
                  Change File
                </button>
              </div>

              <ul className="space-y-1.5 text-xs text-[#64748B]">
                <li className="flex justify-between">
                  <span>Info Metadata Fields:</span>
                  <span className="font-mono font-semibold text-[#102A56]">
                    {inspection.infoFieldsPresent.length > 0
                      ? `${inspection.infoFieldsPresent.length} (${inspection.infoFieldsPresent.slice(0, 3).join(', ')})`
                      : 'None'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>XMP Packet (/Metadata):</span>
                  <span className="font-mono font-semibold text-[#102A56]">
                    {inspection.hasXmpMetadata ? 'Present' : 'None'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Annotations / Comments:</span>
                  <span className="font-mono font-semibold text-[#102A56]">
                    {inspection.annotationCount}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Hidden OCG / AcroForm:</span>
                  <span className="font-mono font-semibold text-[#102A56]">
                    {inspection.hasHiddenLayersOcg || inspection.hasAcroForm ? 'Detected' : 'None'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Marked Regions Manager */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A56]">
                  Marked Blackout Areas ({regions.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={regions.length === 0}
                    onClick={() => setRegions((prev) => prev.slice(0, -1))}
                    className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#102A56] disabled:opacity-40 cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    Undo
                  </button>
                  <button
                    type="button"
                    disabled={regions.length === 0}
                    onClick={() => setRegions([])}
                    className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:underline disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              </div>

              {regions.length === 0 ? (
                <p className="text-xs text-[#64748B] leading-relaxed">
                  No blackout regions marked yet. Draw rectangles directly over the page preview, or use &ldquo;Auto-Mark Text Matches&rdquo; above.
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pe-1">
                  {regions.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-[11px] bg-[#F4F7FB] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentPage(r.pageNumber)}
                        className="text-start truncate font-medium text-[#17243A] hover:text-[#2563EB] cursor-pointer"
                      >
                        #{i + 1} · Page {r.pageNumber} {r.label ? `(${r.label})` : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegions((prev) => prev.filter((it) => it.id !== r.id))}
                        className="text-[#64748B] hover:text-red-600 ms-2 shrink-0 cursor-pointer"
                        aria-label={`Delete region ${i + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy Mode & Execution Controls */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A56] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Destructive Flattening Scope</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      mode === 'targeted'
                        ? 'bg-[#EFF6FF] border-[#2563EB]'
                        : 'border-[#E2E8F0] hover:bg-[#F4F7FB]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="redactMode"
                      checked={mode === 'targeted'}
                      onChange={() => setMode('targeted')}
                      className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div>
                      <div className="font-semibold text-[#102A56]">Targeted Pages (Default)</div>
                      <div className="text-[11px] text-[#64748B]">
                        Destructively flattens only pages with blackout boxes; keeps untouched pages crisp (with annotations &amp; metadata stripped).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      mode === 'deep-flatten-all'
                        ? 'bg-[#EFF6FF] border-[#2563EB]'
                        : 'border-[#E2E8F0] hover:bg-[#F4F7FB]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="redactMode"
                      checked={mode === 'deep-flatten-all'}
                      onChange={() => setMode('deep-flatten-all')}
                      className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div>
                      <div className="font-semibold text-[#102A56]">Deep-Flatten All Pages (Max Scrub)</div>
                      <div className="text-[11px] text-[#64748B]">
                        Flattens every page to clean raster images to eliminate any hidden layers or invisible OCR text across the entire PDF.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-[#E2E8F0]">
                <label className="flex items-center gap-2 text-[#17243A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scrubMetadata}
                    onChange={(e) => setScrubMetadata(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Scrub Author, Title, Creator, Dates &amp; XMP Stream</span>
                </label>

                <label className="flex items-center gap-2 text-[#17243A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stampRedactedLabel}
                    onChange={(e) => setStampRedactedLabel(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Label blackout boxes &ldquo;REDACTED&rdquo;</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleApplyRedaction}
                className="w-full min-h-[44px] py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-[#102A56] hover:bg-[#2563EB] active:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t('banking.privacyButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
