import React, { useEffect, useMemo, useState } from 'react';
import { Document, Page, type DocumentProps } from 'react-pdf';

type LoadedPdfDocument = Parameters<NonNullable<DocumentProps['onLoadSuccess']>>[0];
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns2,
  Eye,
  Grid2x2,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react';
import '../lib/reactPdfSetup';

export type PdfPreviewSource = File | Blob | string | null | undefined;
export type PdfPreviewViewMode = 'grid' | 'single';
export type PdfCompareMode = 'after' | 'before' | 'split';

export interface PdfPreviewProps {
  /** Primary PDF source (single workspace PDF or processed "After" PDF) */
  file: PdfPreviewSource;
  /** Optional "Before" PDF source to enable Before / After / Side-by-Side comparison */
  compareFile?: PdfPreviewSource;
  /** Optional custom 1-based page sequence (e.g. reordered or filtered pages) */
  pageOrder?: number[];
  /** 1-based page numbers highlighted as marked (e.g. pages scheduled for deletion or rotation) */
  markedPageNumbers?: number[];
  /** Visual styling for markedPageNumbers */
  markVariant?: 'delete' | 'select';
  /** Badge text for marked pages (e.g. "Delete" or "+90°") */
  markBadgeText?: string;
  /** Badge text for unmarked pages if desired */
  unmarkedBadgeText?: string;
  /** Additional clockwise rotation (0 | 90 | 180 | 270) applied visually to targeted pages */
  getPageExtraRotation?: (pageNumber: number) => number;
  /** Interactive page click handler (e.g. click thumbnail to toggle page selection) */
  onPageClick?: (pageNumber: number, sequenceIndex: number) => void;
  /** Optional action buttons rendered below each thumbnail card in grid view */
  renderPageActions?: (
    pageNumber: number,
    sequenceIndex: number,
    totalInSequence: number
  ) => React.ReactNode;
  /** Optional custom label per page tile */
  getPageLabel?: (pageNumber: number, sequenceIndex: number) => string;
  /** Heading title for the preview panel */
  title?: string;
  /** Supporting subtext shown next to header */
  subtitle?: string;
  /** Labels for comparison tabs */
  beforeLabel?: string;
  afterLabel?: string;
  /** Initial layout view mode */
  defaultViewMode?: PdfPreviewViewMode;
  /** Allow collapsing the preview container */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Optional extra controls rendered in top toolbar */
  headerActions?: React.ReactNode;
  className?: string;
}

const GRID_PAGE_SIZE = 12;
const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 250];

function usePdfObjectUrl(source: PdfPreviewSource): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    typeof source === 'string' ? source : null
  );

  useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }
    if (typeof source === 'string') {
      setUrl(source);
      return;
    }
    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  return url;
}

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  file,
  compareFile,
  pageOrder,
  markedPageNumbers,
  markVariant = 'select',
  markBadgeText,
  unmarkedBadgeText,
  getPageExtraRotation,
  onPageClick,
  renderPageActions,
  getPageLabel,
  title = 'PDF Page Preview',
  subtitle,
  beforeLabel = 'Before (Original)',
  afterLabel = 'After Changes',
  defaultViewMode = 'grid',
  collapsible = false,
  defaultOpen = true,
  headerActions,
  className = '',
}) => {
  const hasCompare = Boolean(compareFile);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [viewMode, setViewMode] = useState<PdfPreviewViewMode>(defaultViewMode);
  const [compareMode, setCompareMode] = useState<PdfCompareMode>(hasCompare ? 'after' : 'after');
  const [gridChunk, setGridChunk] = useState(0);
  const [singleSeqIndex, setSingleSeqIndex] = useState(0);
  const [zoomPct, setZoomPct] = useState(100);

  const [primaryNumPages, setPrimaryNumPages] = useState(0);
  const [primaryBaseRotations, setPrimaryBaseRotations] = useState<Record<number, number>>({});
  const [primaryError, setPrimaryError] = useState<string | null>(null);

  const [compareNumPages, setCompareNumPages] = useState(0);
  const [compareError, setCompareError] = useState<string | null>(null);

  const primaryUrl = usePdfObjectUrl(file);
  const compareUrl = usePdfObjectUrl(compareFile);

  // Reset pagination when primary source changes
  useEffect(() => {
    setPrimaryNumPages(0);
    setPrimaryBaseRotations({});
    setPrimaryError(null);
    setGridChunk(0);
    setSingleSeqIndex(0);
  }, [primaryUrl]);

  useEffect(() => {
    setCompareNumPages(0);
    setCompareError(null);
  }, [compareUrl]);

  useEffect(() => {
    if (!hasCompare && compareMode !== 'after') {
      setCompareMode('after');
    }
  }, [hasCompare, compareMode]);

  const markedSet = useMemo(() => new Set(markedPageNumbers || []), [markedPageNumbers]);

  // Determine active sequence for the current tab
  const activeSequence = useMemo(() => {
    if (compareMode === 'before' && hasCompare) {
      return Array.from({ length: compareNumPages }, (_, i) => i + 1);
    }
    if (pageOrder && pageOrder.length > 0) {
      return primaryNumPages > 0
        ? pageOrder.filter((p) => p >= 1 && p <= primaryNumPages)
        : pageOrder;
    }
    return Array.from({ length: primaryNumPages }, (_, i) => i + 1);
  }, [compareMode, hasCompare, compareNumPages, pageOrder, primaryNumPages]);

  const totalSeqPages = activeSequence.length;
  const totalChunks = Math.max(1, Math.ceil(totalSeqPages / GRID_PAGE_SIZE));
  const safeGridChunk = Math.min(gridChunk, totalChunks - 1);
  const safeSingleIdx = totalSeqPages > 0 ? Math.min(singleSeqIndex, totalSeqPages - 1) : 0;

  useEffect(() => {
    if (gridChunk !== safeGridChunk) setGridChunk(safeGridChunk);
  }, [gridChunk, safeGridChunk]);

  useEffect(() => {
    if (singleSeqIndex !== safeSingleIdx) setSingleSeqIndex(safeSingleIdx);
  }, [singleSeqIndex, safeSingleIdx]);

  const chunkStart = safeGridChunk * GRID_PAGE_SIZE;
  const visibleSlice = activeSequence.slice(chunkStart, chunkStart + GRID_PAGE_SIZE);

  const handlePrimaryLoadSuccess = async (pdf: LoadedPdfDocument) => {
    setPrimaryNumPages(pdf.numPages);
    setPrimaryError(null);
    // Read inherent page rotations only when rotation preview callback is supplied (fast lookup)
    if (getPageExtraRotation) {
      try {
        const limit = Math.min(pdf.numPages, 60);
        const entries = await Promise.all(
          Array.from({ length: limit }, async (_, idx) => {
            const pNum = idx + 1;
            const page = await pdf.getPage(pNum);
            return [pNum, page.rotate || 0] as const;
          })
        );
        const map: Record<number, number> = {};
        for (const [pNum, rot] of entries) {
          map[pNum] = rot;
        }
        setPrimaryBaseRotations(map);
      } catch {
        // Non-critical fallback
      }
    }
  };

  const handleZoomOut = () => {
    setZoomPct((prev) => {
      const idx = ZOOM_STEPS.indexOf(prev);
      if (idx > 0) return ZOOM_STEPS[idx - 1];
      const lower = [...ZOOM_STEPS].reverse().find((step) => step < prev);
      return lower ?? ZOOM_STEPS[0];
    });
  };

  const handleZoomIn = () => {
    setZoomPct((prev) => {
      const idx = ZOOM_STEPS.indexOf(prev);
      if (idx >= 0 && idx < ZOOM_STEPS.length - 1) return ZOOM_STEPS[idx + 1];
      const higher = ZOOM_STEPS.find((step) => step > prev);
      return higher ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
    });
  };

  const handleZoomReset = () => {
    setZoomPct(100);
  };

  if (!file) return null;

  const gridColsClass =
    zoomPct <= 75
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
      : zoomPct <= 100
        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        : zoomPct <= 150
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          : zoomPct <= 200
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1';

  const gridBaseWidth = zoomPct <= 75 ? 150 : zoomPct === 100 ? 170 : 210;
  const gridRenderWidth = Math.round(gridBaseWidth * (zoomPct / 100));
  const singleRenderWidth = Math.round(480 * (zoomPct / 100));
  const splitRenderWidth = Math.round(340 * (zoomPct / 100));

  const effectiveSourceUrl =
    compareMode === 'before' && compareUrl ? compareUrl : primaryUrl;
  const effectiveNumPages =
    compareMode === 'before' && compareUrl ? compareNumPages : primaryNumPages;
  const effectiveError =
    compareMode === 'before' && compareUrl ? compareError : primaryError;

  const singlePageNum = activeSequence[safeSingleIdx] ?? 1;
  const splitMaxPages = Math.max(compareNumPages, primaryNumPages, 1);
  const splitPageNum = Math.min(safeSingleIdx + 1, splitMaxPages);

  return (
    <section
      aria-label={title}
      className={`w-full border border-slate-200 rounded-lg bg-slate-50/75 overflow-hidden text-left ${className}`}
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{title}</h4>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
              {subtitle ||
                (effectiveNumPages > 0
                  ? `${totalSeqPages} ${totalSeqPages === 1 ? 'page' : 'pages'}`
                  : 'Loading pages...')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOpen && headerActions}

          {/* Before / After / Side-by-Side Switcher (when compareFile is provided) */}
          {isOpen && hasCompare && (
            <div
              role="group"
              aria-label="Compare before and after"
              className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium"
            >
              <button
                type="button"
                onClick={() => setCompareMode('after')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  compareMode === 'after'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {afterLabel}
              </button>
              <button
                type="button"
                onClick={() => setCompareMode('before')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  compareMode === 'before'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {beforeLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompareMode('split');
                  setSingleSeqIndex(0);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  compareMode === 'split'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns2 className="w-3 h-3" />
                <span>Side-by-Side</span>
              </button>
            </div>
          )}

          {/* Grid vs Single Page View Switcher */}
          {isOpen && compareMode !== 'split' && (
            <div
              role="group"
              aria-label="Preview layout"
              className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid2x2 className="w-3 h-3" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>Single</span>
              </button>
            </div>
          )}

          {/* Zoom Controls (+/-) */}
          {isOpen && (
            <div
              role="group"
              aria-label="Zoom controls"
              className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium"
            >
              <button
                type="button"
                disabled={zoomPct <= ZOOM_STEPS[0]}
                onClick={handleZoomOut}
                aria-label="Zoom out"
                title="Zoom out"
                className="p-1 rounded text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                disabled={zoomPct === 100}
                aria-label={`Zoom ${zoomPct}%, click to reset to 100%`}
                title={zoomPct === 100 ? 'Zoom level' : 'Reset zoom to 100%'}
                className="px-1.5 py-0.5 font-mono tabular-nums text-[11px] text-slate-700 min-w-[42px] text-center rounded hover:bg-white disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-default"
              >
                {zoomPct}%
              </button>
              <button
                type="button"
                disabled={zoomPct >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                onClick={handleZoomIn}
                aria-label="Zoom in"
                title="Zoom in"
                className="p-1 rounded text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Collapsible Toggle */}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-expanded={isOpen}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              {isOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Preview</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show Preview</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Body */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Side-by-Side Comparison View */}
          {compareMode === 'split' && hasCompare && primaryUrl && compareUrl ? (
            <div className="space-y-3">
              {/* Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={splitPageNum <= 1}
                    onClick={() => setSingleSeqIndex((i) => Math.max(0, i - 1))}
                    aria-label="Previous comparison page"
                    className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono tabular-nums text-slate-700 px-1.5">
                    Page {splitPageNum} / {splitMaxPages}
                  </span>
                  <button
                    type="button"
                    disabled={splitPageNum >= splitMaxPages}
                    onClick={() =>
                      setSingleSeqIndex((i) => Math.min(splitMaxPages - 1, i + 1))
                    }
                    aria-label="Next comparison page"
                    className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  Zoom {zoomPct}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before (Original) */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">{beforeLabel}</span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      {compareNumPages > 0 ? `${compareNumPages} pages` : '...'}
                    </span>
                  </div>
                  <div
                    className={`w-full overflow-auto max-h-[480px] bg-slate-100/80 rounded p-2 [&_canvas]:shadow-xs ${
                      zoomPct <= 100 ? '[&_canvas]:!max-w-full [&_canvas]:!h-auto' : ''
                    }`}
                  >
                    <div className="min-w-full w-fit flex justify-center">
                      <Document
                        file={compareUrl}
                        suspense={false}
                        onLoadSuccess={(pdf) => {
                          setCompareNumPages(pdf.numPages);
                          setCompareError(null);
                        }}
                        onLoadError={(err) => setCompareError(err.message)}
                        loading={
                          <div className="flex items-center gap-2 py-12 text-xs text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Loading original PDF...</span>
                          </div>
                        }
                        error={
                          <div className="flex items-center gap-2 py-8 px-3 text-xs text-red-700">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{compareError || 'Could not load original PDF.'}</span>
                          </div>
                        }
                      >
                        {splitPageNum <= (compareNumPages || 1) ? (
                          <Page
                            pageNumber={splitPageNum}
                            width={splitRenderWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            suspense={false}
                            loading={
                              <div className="py-12 text-xs text-slate-400">Rendering page...</div>
                            }
                          />
                        ) : (
                          <div className="py-16 px-4 text-center text-xs text-slate-500">
                            No page {splitPageNum} in original document.
                          </div>
                        )}
                      </Document>
                    </div>
                  </div>
                </div>

                {/* After Changes */}
                <div className="bg-white border border-blue-200 rounded-lg p-3 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-100">
                    <span className="font-semibold text-blue-800">{afterLabel}</span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      {primaryNumPages > 0 ? `${primaryNumPages} pages` : '...'}
                    </span>
                  </div>
                  <div
                    className={`w-full overflow-auto max-h-[480px] bg-slate-100/80 rounded p-2 [&_canvas]:shadow-xs ${
                      zoomPct <= 100 ? '[&_canvas]:!max-w-full [&_canvas]:!h-auto' : ''
                    }`}
                  >
                    <div className="min-w-full w-fit flex justify-center">
                    <Document
                      file={primaryUrl}
                      suspense={false}
                      onLoadSuccess={handlePrimaryLoadSuccess}
                      onLoadError={(err) => setPrimaryError(err.message)}
                      loading={
                        <div className="flex items-center gap-2 py-12 text-xs text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading processed PDF...</span>
                        </div>
                      }
                      error={
                        <div className="flex items-center gap-2 py-8 px-3 text-xs text-red-700">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{primaryError || 'Could not load processed PDF.'}</span>
                        </div>
                      }
                    >
                      {splitPageNum <= (primaryNumPages || 1) ? (
                        <Page
                          pageNumber={splitPageNum}
                          width={splitRenderWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          suspense={false}
                          loading={
                            <div className="py-12 text-xs text-slate-400">Rendering page...</div>
                          }
                        />
                      ) : (
                        <div className="py-16 px-4 text-center text-xs text-slate-500">
                          Page {splitPageNum} removed in output ({primaryNumPages} page
                          {primaryNumPages === 1 ? '' : 's'} total).
                        </div>
                      )}
                    </Document>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Single Document View (Grid or Single-Page Reader) */
            effectiveSourceUrl && (
              <Document
                file={effectiveSourceUrl}
                suspense={false}
                onLoadSuccess={(pdf) => {
                  if (compareMode === 'before' && hasCompare) {
                    setCompareNumPages(pdf.numPages);
                    setCompareError(null);
                  } else {
                    handlePrimaryLoadSuccess(pdf);
                  }
                }}
                onLoadError={(err) => {
                  if (compareMode === 'before' && hasCompare) {
                    setCompareError(err.message);
                  } else {
                    setPrimaryError(err.message);
                  }
                }}
                loading={
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Rendering PDF preview in browser memory...</span>
                  </div>
                }
                error={
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{effectiveError || 'Unable to render PDF preview.'}</span>
                  </div>
                }
              >
                {effectiveNumPages > 0 && viewMode === 'grid' && (
                  <div className="space-y-3">
                    <div className={`grid ${gridColsClass} gap-3`}>
                      {visibleSlice.map((pageNum, localIdx) => {
                        const seqIndex = chunkStart + localIdx;
                        const isMarked =
                          compareMode !== 'before' && markedSet.has(pageNum);
                        const extraRot =
                          compareMode !== 'before' && getPageExtraRotation
                            ? getPageExtraRotation(pageNum)
                            : 0;
                        const baseRot = primaryBaseRotations[pageNum];
                        const resolvedRotate =
                          extraRot !== 0
                            ? normalizeAngle((baseRot ?? 0) + extraRot)
                            : undefined;

                        const borderClass = isMarked
                          ? markVariant === 'delete'
                            ? 'border-red-400 bg-red-50/40 ring-1 ring-red-300'
                            : 'border-blue-500 bg-blue-50/35 ring-1 ring-blue-400'
                          : 'border-slate-200 bg-white hover:border-slate-300';

                        const label = getPageLabel
                          ? getPageLabel(pageNum, seqIndex)
                          : `Page ${pageNum}`;

                        return (
                          <div
                            key={`${pageNum}-${seqIndex}`}
                            className={`rounded-lg border p-2 flex flex-col justify-between transition-all ${borderClass}`}
                          >
                            {/* Interactive Thumbnail Surface */}
                            <div className="relative group">
                              <div
                                className={`w-full bg-slate-100 rounded border border-slate-200/80 p-1 [&_canvas]:shadow-xs ${
                                  zoomPct <= 100
                                    ? 'aspect-[3/4] overflow-hidden flex items-center justify-center [&_canvas]:!max-w-full [&_canvas]:!max-h-full [&_canvas]:!w-auto [&_canvas]:!h-auto'
                                    : 'max-h-[420px] overflow-auto'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onPageClick && compareMode !== 'before') {
                                      onPageClick(pageNum, seqIndex);
                                    } else {
                                      setSingleSeqIndex(seqIndex);
                                      setViewMode('single');
                                    }
                                  }}
                                  aria-label={
                                    onPageClick && compareMode !== 'before'
                                      ? `${label} (${isMarked ? 'selected' : 'unselected'})`
                                      : `Inspect ${label}`
                                  }
                                  className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                                    zoomPct <= 100
                                      ? 'w-full h-full flex items-center justify-center'
                                      : 'min-w-full w-fit mx-auto flex justify-center'
                                  }`}
                                >
                                  <Page
                                    pageNumber={pageNum}
                                    width={gridRenderWidth}
                                    rotate={resolvedRotate}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    suspense={false}
                                    loading={
                                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    }
                                    error={
                                      <span className="text-[10px] text-red-600 px-1 text-center">
                                        Render error
                                      </span>
                                    }
                                  />
                                </button>
                              </div>

                              {/* Subtle visual status tag when marked or rotated */}
                              {isMarked && markBadgeText && (
                                <span
                                  className={`pointer-events-none absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shadow-xs ${
                                    markVariant === 'delete'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {markVariant === 'delete' ? (
                                    <Trash2 className="w-2.5 h-2.5" />
                                  ) : extraRot > 0 ? (
                                    <RotateCw className="w-2.5 h-2.5" />
                                  ) : (
                                    <Check className="w-2.5 h-2.5" />
                                  )}
                                  <span>{markBadgeText}</span>
                                </span>
                              )}

                              {!isMarked && unmarkedBadgeText && (
                                <span className="pointer-events-none absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/75 text-white">
                                  {unmarkedBadgeText}
                                </span>
                              )}

                              {extraRot > 0 && !(isMarked && markBadgeText) && (
                                <span className="pointer-events-none absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-blue-600 text-white shadow-xs">
                                  <RotateCw className="w-2.5 h-2.5" />
                                  +{extraRot}°
                                </span>
                              )}

                              {/* Quick-inspect zoom trigger when card click toggles selection */}
                              {onPageClick && compareMode !== 'before' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSingleSeqIndex(seqIndex);
                                    setViewMode('single');
                                  }}
                                  aria-label={`Zoom inspect ${label}`}
                                  title="Inspect full page"
                                  className="absolute top-1.5 right-1.5 p-1 rounded bg-white/95 border border-slate-300 text-slate-600 hover:text-blue-700 opacity-85 hover:opacity-100 shadow-xs cursor-pointer"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Footer Caption & Optional Per-Page Controls */}
                            <div className="pt-2 space-y-1.5">
                              <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums">
                                <span className="font-semibold text-slate-800 truncate">
                                  {label}
                                </span>
                                <span className="text-slate-400 shrink-0">
                                  #{seqIndex + 1}
                                </span>
                              </div>
                              {compareMode !== 'before' &&
                                renderPageActions &&
                                renderPageActions(pageNum, seqIndex, totalSeqPages)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Grid Pagination Bar */}
                    {totalChunks > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 font-mono tabular-nums">
                          Showing {chunkStart + 1}–
                          {Math.min(chunkStart + GRID_PAGE_SIZE, totalSeqPages)} of {totalSeqPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={safeGridChunk === 0}
                            onClick={() => setGridChunk((c) => Math.max(0, c - 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>
                          <button
                            type="button"
                            disabled={safeGridChunk >= totalChunks - 1}
                            onClick={() => setGridChunk((c) => Math.min(totalChunks - 1, c + 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {effectiveNumPages > 0 && viewMode === 'single' && (
                  <div className="space-y-3">
                    {/* Reader Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={safeSingleIdx <= 0}
                          onClick={() => setSingleSeqIndex((i) => Math.max(0, i - 1))}
                          aria-label="Previous page"
                          className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono tabular-nums text-slate-700 px-1.5">
                          {getPageLabel
                            ? getPageLabel(singlePageNum, safeSingleIdx)
                            : `Page ${singlePageNum}`}{' '}
                          ({safeSingleIdx + 1} / {totalSeqPages})
                        </span>
                        <button
                          type="button"
                          disabled={safeSingleIdx >= totalSeqPages - 1}
                          onClick={() =>
                            setSingleSeqIndex((i) => Math.min(totalSeqPages - 1, i + 1))
                          }
                          aria-label="Next page"
                          className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {onPageClick && compareMode !== 'before' && (
                          <button
                            type="button"
                            onClick={() => onPageClick(singlePageNum, safeSingleIdx)}
                            className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                              markedSet.has(singlePageNum)
                                ? markVariant === 'delete'
                                  ? 'bg-red-600 text-white border-red-600'
                                  : 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {markedSet.has(singlePageNum)
                              ? markBadgeText || 'Selected'
                              : markVariant === 'delete'
                                ? 'Mark to Delete'
                                : 'Select Page'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Centered Full Page Canvas */}
                    <div
                      className={`w-full overflow-auto max-h-[540px] bg-slate-200/60 border border-slate-200 rounded-lg p-3 [&_canvas]:shadow-sm ${
                        zoomPct <= 100 ? '[&_canvas]:!max-w-full [&_canvas]:!h-auto' : ''
                      }`}
                    >
                      <div className="min-w-full w-fit flex justify-center">
                        <Page
                          pageNumber={singlePageNum}
                          width={singleRenderWidth}
                          rotate={
                            compareMode !== 'before' && getPageExtraRotation
                              ? getPageExtraRotation(singlePageNum) !== 0
                                ? normalizeAngle(
                                    (primaryBaseRotations[singlePageNum] ?? 0) +
                                      getPageExtraRotation(singlePageNum)
                                  )
                                : undefined
                              : undefined
                          }
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          suspense={false}
                          loading={
                            <div className="py-16 flex items-center gap-2 text-xs text-slate-500">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span>Rendering page {singlePageNum}...</span>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Document>
            )
          )}
        </div>
      )}
    </section>
  );
};
