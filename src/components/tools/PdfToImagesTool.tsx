import React, { useState, useEffect, useRef } from 'react';
import {
  FileImage,
  Download,
  Archive,
  AlertCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import {
  BatchProgressItem,
  ProcessingFile,
  ImageFormatOption,
  PdfToImagesOptions,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { BatchFileQueue } from '../BatchFileQueue';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { convertPdfToImages, RenderedPageImage, PdfToImagesResult } from '../../lib/pdfToImages';
import { formatBytes, downloadBlob } from '../../lib/pdfUtils';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';
import {
  BatchImagesZipSummary,
  BatchItemOutcome,
  createBatchProgressItems,
  packageBatchImagesToZip,
  runSequentialBatch,
  updateBatchProgressItems,
  validateAndInspectPdfQueue,
} from '../../lib/batchProcessing';

export const PdfToImagesTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [format, setFormat] = useState<ImageFormatOption>('image/png');
  const [scale, setScale] = useState<number>(1.5);
  const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('1');

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [batchProgressItems, setBatchProgressItems] = useState<BatchProgressItem[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(1);
  const [result, setResult] = useState<PdfToImagesResult | null>(null);
  const [batchItems, setBatchItems] = useState<BatchItemOutcome<PdfToImagesResult>[] | null>(null);
  const [batchZip, setBatchZip] = useState<BatchImagesZipSummary | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [expandedFileIds, setExpandedFileIds] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusRef = useRef(status);
  const filesRef = useRef(files);
  const createdUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const revokeAllPreviewUrls = () => {
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current.clear();
  };

  useEffect(() => {
    return () => {
      revokeAllPreviewUrls();
    };
  }, []);

  const handleFilesSelected = async (incomingFiles: File[]) => {
    if (statusRef.current === 'processing' || statusRef.current === 'success') return;
    if (incomingFiles.length === 0) return;
    setErrorMessage(null);

    const { validItems, errorMessage: validationError } = await validateAndInspectPdfQueue(
      incomingFiles,
      filesRef.current
    );

    if (validationError) {
      setErrorMessage(validationError);
    }
    if (validItems.length === 0) return;

    const wasEmpty = filesRef.current.length === 0;
    revokeAllPreviewUrls();
    setPreviewUrls({});
    setStatus('idle');
    setResult(null);
    setBatchItems(null);
    setBatchZip(null);
    setFiles((prev) => [...prev, ...validItems]);

    if (wasEmpty) {
      const firstCount = validItems[0].pageCount ?? 1;
      setPageRange(firstCount > 1 ? `1-${Math.min(3, firstCount)}` : '1');
    }
  };

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.pdfToImages.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setErrorMessage(null);
  };

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('pdf-to-images');
    try {
      const [sample1, sample2] = await Promise.all([
        createSamplePdf('Presentation Slides', 2),
        createSamplePdf('Invoice Appendix', 2),
      ]);
      filesRef.current = [];
      setFiles([]);
      await handleFilesSelected([sample1, sample2]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDFs: ${err.message}`);
    }
  };

  const handleCancelBatch = () => {
    abortControllerRef.current?.abort();
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setStatus('processing');
    setBatchProgressItems(createBatchProgressItems(files));
    setCurrentFileIndex(1);
    setProgress({ current: 0, total: Math.max(1, files.length * 100), message: t('progress.processing') });
    trackToolStart('pdf-to-images');
    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const options: PdfToImagesOptions = {
        format,
        scale,
        quality: 0.9,
        pageSelection,
        pageRange,
      };

      const summary = await runSequentialBatch(
        files,
        (fileItem, onItemProgress) => convertPdfToImages(fileItem, options, onItemProgress),
        {
          onProgress: (curr, tot, msg) => {
            setProgress({ current: curr, total: tot, message: msg });
          },
          onItemStatus: (index, itemStatus, itemPercent, detail) => {
            setCurrentFileIndex(index + 1);
            setBatchProgressItems((prev) =>
              updateBatchProgressItems(prev, index, itemStatus, itemPercent, detail)
            );
          },
          signal: controller.signal,
        }
      );

      abortControllerRef.current = null;

      if (summary.cancelled) {
        setStatus('idle');
        setErrorMessage('Batch rendering was cancelled. Your queued files remain ready.');
        return;
      }

      if (summary.successCount === 0) {
        const firstError = summary.items.find((item) => item.error)?.error;
        setStatus('error');
        setErrorMessage(firstError || 'Failed to render PDF pages into images.');
        trackToolError('pdf-to-images', 'BatchRenderFailed');
        return;
      }

      let totalRendered = 0;
      for (const item of summary.items) {
        if (item.status === 'success' && item.result) {
          totalRendered += item.result.totalRendered;
        }
      }

      const registerPreviewUrls = () => {
        revokeAllPreviewUrls();
        const nextUrls: Record<string, string> = {};
        for (const item of summary.items) {
          if (item.status === 'success' && item.result) {
            for (const img of item.result.images) {
              const objectUrl = URL.createObjectURL(img.blob);
              createdUrlsRef.current.add(objectUrl);
              nextUrls[`${item.fileItem.id}:${img.pageNumber}`] = objectUrl;
            }
          }
        }
        setPreviewUrls(nextUrls);
      };

      if (files.length === 1 && summary.items[0]?.status === 'success' && summary.items[0].result) {
        registerPreviewUrls();
        setResult(summary.items[0].result);
        setBatchItems(null);
        setBatchZip(null);
        setStatus('success');
      } else {
        setProgress({
          current: files.length * 100,
          total: files.length * 100,
          message: 'Packaging all rendered images into organized ZIP folders...',
        });
        const zipSummary = await packageBatchImagesToZip(summary.items, 'pdf-to-images-batch.zip');
        registerPreviewUrls();
        const firstSuccess = summary.items.find((item) => item.status === 'success');
        setExpandedFileIds(firstSuccess ? { [firstSuccess.fileItem.id]: true } : {});
        setResult(null);
        setBatchItems(summary.items);
        setBatchZip(zipSummary);
        setStatus('success');
      }

      trackToolSuccess('pdf-to-images', {
        durationMs: Date.now() - startTime,
        pageCount: totalRendered,
      });
    } catch (err: any) {
      abortControllerRef.current = null;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to render PDF pages into images.');
      trackToolError('pdf-to-images', err.name || 'RenderError');
    }
  };

  const handleDownloadSingle = (image: RenderedPageImage) => {
    downloadBlob(image.blob, image.filename);
  };

  const handleDownloadZip = () => {
    if (!result) return;
    downloadBlob(result.zipBlob, result.zipFilename);
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    revokeAllPreviewUrls();
    setPreviewUrls({});
    setExpandedFileIds({});
    setStatus('idle');
    setResult(null);
    setBatchItems(null);
    setBatchZip(null);
    setFiles([]);
    setErrorMessage(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedFileIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.pdfToImages.title')}
        batchItems={batchProgressItems}
        currentFileIndex={currentFileIndex}
        totalFiles={files.length}
        itemLabel="PDF"
        onCancel={files.length > 1 ? handleCancelBatch : undefined}
      />
    );
  }

  // Single-PDF Result View (unchanged visual ergonomics)
  if (status === 'success' && result && files[0]) {
    const singleFileId = files[0].id;
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Rendered {result.totalRendered} {result.format.toUpperCase()} {result.totalRendered === 1 ? 'Image' : 'Images'}
            </h3>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              Archive size: {formatBytes(result.zipBlob.size)} · Ready for immediate download
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadZip}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Archive className="w-4 h-4" />
              <span>Download All as ZIP</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Convert another PDF
            </button>
          </div>
        </div>

        <PerformanceMonitor
          variant="summary"
          inputBytes={files[0].size}
          outputBytes={result.zipBlob.size}
          className="mt-5"
        />

        {result.warnings && result.warnings.length > 0 && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* Rendered Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {result.images.map((img) => (
            <div
              key={img.pageNumber}
              className="border border-slate-200 rounded-lg bg-slate-50 p-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="aspect-[3/4] bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center p-2 mb-3 shadow-inner">
                <img
                  src={previewUrls[`${singleFileId}:${img.pageNumber}`]}
                  alt={`Page ${img.pageNumber}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-slate-900">Page {img.pageNumber}</span>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {img.width} × {img.height}px ({formatBytes(img.size)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(img)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Page {img.pageNumber}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Multi-PDF Batch Result View
  if (status === 'success' && batchItems && batchZip) {
    const successCount = batchItems.filter((item) => item.status === 'success').length;
    const errorCount = batchItems.length - successCount;

    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                errorCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {errorCount > 0 ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Batch Image Export Complete
              </h3>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                {successCount} of {batchItems.length} PDFs converted · {batchZip.totalImages} total images · ZIP archive{' '}
                {formatBytes(batchZip.zipBlob.size)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => downloadBlob(batchZip.zipBlob, batchZip.zipFilename)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Archive className="w-4 h-4" />
              <span>Download All Images as ZIP</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Process More Files</span>
            </button>
          </div>
        </div>

        <PerformanceMonitor
          variant="summary"
          inputBytes={files.reduce((sum, item) => sum + item.size, 0)}
          outputBytes={batchZip.zipBlob.size}
          className="mt-5"
        />

        {batchItems.some((it) => it.result?.warnings && it.result.warnings.length > 0) && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {batchItems.flatMap((it) =>
                (it.result?.warnings || []).map((w, i) => (
                  <p key={`${it.fileItem.id}-warn-${i}`}>
                    <strong>{it.fileItem.name}:</strong> {w}
                  </p>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {batchItems.map((item) => {
            const res = item.result;
            const isExpanded = !!expandedFileIds[item.fileItem.id];

            return (
              <div
                key={item.fileItem.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-50/70">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        item.status === 'success'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {item.status === 'success' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {item.fileItem.name}
                      </p>
                      {item.status === 'success' && res ? (
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {res.totalRendered} {res.format.toUpperCase()}{' '}
                          {res.totalRendered === 1 ? 'image' : 'images'} · ZIP {formatBytes(res.zipBlob.size)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-red-700 mt-0.5">
                          {item.error || 'Could not render this PDF.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.status === 'success' && res && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.fileItem.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Previews</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Show Previews ({res.totalRendered})</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadBlob(res.zipBlob, res.zipFilename)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download ZIP</span>
                      </button>
                    </div>
                  )}
                </div>

                {item.status === 'success' && res && isExpanded && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border-t border-slate-200 bg-white">
                    {res.images.map((img) => (
                      <div
                        key={img.pageNumber}
                        className="border border-slate-200 rounded-lg bg-slate-50 p-2.5 flex flex-col justify-between"
                      >
                        <div className="aspect-[3/4] bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center p-1.5 mb-2">
                          <img
                            src={previewUrls[`${item.fileItem.id}:${img.pageNumber}`]}
                            alt={`${item.fileItem.name} page ${img.pageNumber}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="font-semibold text-slate-900">Page {img.pageNumber}</span>
                          <span className="text-slate-500 font-mono tabular-nums">{formatBytes(img.size)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(img)}
                          className="w-full inline-flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      {files.length === 0 ? (
        <div className="space-y-3">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={true}
            delegateValidation={true}
            onFilesSelected={handleFilesSelected}
            onSampleRequested={handleLoadSample}
            sampleLabel="Load 2 sample PDFs for batch conversion"
            helperText="Upload 1 or more PDF files (up to 250 MB total). High-resolution canvas rendering converts each document sequentially into crisp PNG or JPEG images."
          />
          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <BatchFileQueue
            files={files}
            onAddFiles={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleReset}
          />

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="formatSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Image Format
              </label>
              <select
                id="formatSelect"
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormatOption)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="image/png">PNG (Lossless, sharpest text)</option>
                <option value="image/jpeg">JPEG (Compact file size)</option>
              </select>
            </div>

            <div>
              <label htmlFor="resolutionSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution & Scale
              </label>
              <select
                id="resolutionSelect"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={1.5}>Standard Quality (1.5× scale / ~110 DPI)</option>
                <option value={2.0}>High Quality (2.0× scale / ~150 DPI)</option>
                <option value={3.0}>Ultra Crisp (3.0× scale / ~220 DPI)</option>
              </select>
            </div>

            <div>
              <label htmlFor="pageSelectionSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Pages to Render
              </label>
              <select
                id="pageSelectionSelect"
                value={pageSelection}
                onChange={(e) => setPageSelection(e.target.value as 'all' | 'range')}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">
                  {files.length === 1
                    ? `All Pages (1 to ${files[0].pageCount ?? 1})`
                    : 'All Pages in Each PDF'}
                </option>
                <option value="range">Specific Page Range</option>
              </select>
            </div>
          </div>

          {pageSelection === 'range' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <label htmlFor="targetRangeInput" className="block text-xs font-semibold text-slate-700 mb-1">
                {files.length > 1
                  ? 'Specify Pages for Each PDF (e.g. 1-2, 3)'
                  : 'Specify Pages (e.g. 1-2, 3)'}
              </label>
              <input
                id="targetRangeInput"
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="e.g. 1-3"
              />
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleConvert}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <FileImage className="w-4 h-4" />
              <span>
                {files.length > 1
                  ? `Convert ${files.length} PDFs Sequentially`
                  : 'Convert PDF to Images Now'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

