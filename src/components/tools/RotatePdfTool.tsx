import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, AlertCircle, Layers } from 'lucide-react';
import { BatchProgressItem, ProcessingFile, ProcessingResult, RotateAngle } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { BatchFileQueue } from '../BatchFileQueue';
import { BatchSuccessDownload } from '../BatchSuccessDownload';
import { PdfPreview } from '../PdfPreview';
import { rotatePdfFile } from '../../lib/rotatePdf';
import { parsePageRange, togglePageInRangeString } from '../../lib/pdfUtils';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';
import {
  BatchItemOutcome,
  BatchPdfZipSummary,
  createBatchProgressItems,
  packageBatchPdfsToZip,
  runSequentialBatch,
  updateBatchProgressItems,
  validateAndInspectPdfQueue,
} from '../../lib/batchProcessing';

export const RotatePdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [angle, setAngle] = useState<RotateAngle>(90);
  const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('1');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [batchProgressItems, setBatchProgressItems] = useState<BatchProgressItem[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(1);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [batchItems, setBatchItems] = useState<BatchItemOutcome<ProcessingResult>[] | null>(null);
  const [batchZip, setBatchZip] = useState<BatchPdfZipSummary | null>(null);
  const [previewRotated, setPreviewRotated] = useState(true);
  const [previewFileIdx, setPreviewFileIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusRef = useRef(status);
  const filesRef = useRef(files);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

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
    setStatus('idle');
    setResult(null);
    setBatchItems(null);
    setBatchZip(null);
    setFiles((prev) => [...prev, ...validItems]);

    if (wasEmpty) {
      const firstCount = validItems[0].pageCount ?? 1;
      setPageRange(firstCount > 1 ? `1-${Math.min(2, firstCount)}` : '1');
    }
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.rotate.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setErrorMessage(null);
  };

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('rotate-pdf');
    try {
      const [sample1, sample2] = await Promise.all([
        createSamplePdf('Scanned Compliance Packet', 3),
        createSamplePdf('Landscape Exhibit Stack', 2),
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

  const handleRotate = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setStatus('processing');
    setBatchProgressItems(createBatchProgressItems(files));
    setCurrentFileIndex(1);
    setProgress({ current: 0, total: Math.max(1, files.length * 100), message: t('progress.processing') });
    trackToolStart('rotate-pdf');
    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const summary = await runSequentialBatch(
        files,
        (fileItem, onItemProgress) =>
          rotatePdfFile(fileItem, { angle, pageSelection, pageRange }, onItemProgress),
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
        setErrorMessage('Batch processing was cancelled. Your queued files remain ready.');
        return;
      }

      if (summary.successCount === 0) {
        const firstError = summary.items.find((item) => item.error)?.error;
        setStatus('error');
        setErrorMessage(firstError || 'Failed to rotate selected PDFs.');
        trackToolError('rotate-pdf', 'BatchRotateFailed');
        return;
      }

      const totalPages = summary.items.reduce(
        (sum, item) => sum + (item.result?.pageCount ?? item.fileItem.pageCount ?? 0),
        0
      );

      if (files.length === 1 && summary.items[0]?.status === 'success' && summary.items[0].result) {
        setResult(summary.items[0].result);
        setBatchItems(null);
        setBatchZip(null);
        setStatus('success');
      } else {
        setProgress({
          current: files.length * 100,
          total: files.length * 100,
          message: 'Packaging rotated PDFs into ZIP archive...',
        });
        const zipSummary = await packageBatchPdfsToZip(summary.items, 'rotated-pdfs-batch.zip');
        setResult(null);
        setBatchItems(summary.items);
        setBatchZip(zipSummary);
        setStatus('success');
      }

      trackToolSuccess('rotate-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: totalPages,
      });
    } catch (err: any) {
      abortControllerRef.current = null;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to rotate PDF.');
      trackToolError('rotate-pdf', err.name || 'RotateError');
    }
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus('idle');
    setResult(null);
    setBatchItems(null);
    setBatchZip(null);
    setFiles([]);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        originalFile={files[0]?.file}
        onReset={handleReset}
        title={t('tool.rotate.successTitle')}
        relatedToolPath="/reorder-pdf-pages"
        relatedToolName="Reorder PDF Pages"
      />
    );
  }

  if (status === 'success' && batchItems) {
    return (
      <BatchSuccessDownload
        title="Batch Rotation Complete"
        items={batchItems}
        zipSummary={batchZip}
        onReset={handleReset}
        relatedToolPath="/reorder-pdf-pages"
        relatedToolName="Reorder PDF Pages"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.rotate.title')}
        batchItems={batchProgressItems}
        currentFileIndex={currentFileIndex}
        totalFiles={files.length}
        itemLabel="PDF"
        onCancel={files.length > 1 ? handleCancelBatch : undefined}
      />
    );
  }

  const safePreviewFileIdx = files.length > 0 ? Math.min(previewFileIdx, files.length - 1) : 0;
  const previewTargetFile = files[safePreviewFileIdx];
  const previewMaxPages = previewTargetFile?.pageCount ?? 1;
  let targetedPreviewPages: number[] = [];
  if (previewTargetFile) {
    if (pageSelection === 'all') {
      targetedPreviewPages = Array.from({ length: previewMaxPages }, (_, i) => i + 1);
    } else if (pageRange.trim()) {
      try {
        targetedPreviewPages = parsePageRange(pageRange, previewMaxPages).map((i) => i + 1);
      } catch {
        targetedPreviewPages = [];
      }
    }
  }
  const targetedPreviewSet = new Set(targetedPreviewPages);

  const angleOptions: { value: RotateAngle; label: string; desc: string }[] = [
    { value: 90, label: '90° Clockwise (Right)', desc: 'Fixes scans turned sideways to the left' },
    { value: 180, label: '180° Upside Down', desc: 'Flips upside-down pages upright' },
    { value: 270, label: '270° Counter-Clockwise (Left)', desc: 'Fixes scans turned sideways to the right' },
  ];

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
            sampleLabel="Load 2 sample PDFs for batch rotation"
            helperText="Select 1 or more PDF files (up to 250 MB total) to fix sideways or upside-down page orientation."
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

          {/* Angle Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Rotation Angle {files.length > 1 ? '(applied to all queued PDFs)' : ''}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {angleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAngle(opt.value)}
                  className={`p-3.5 text-left border rounded-lg transition-all ${
                    angle === opt.value
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCw className={`w-4 h-4 ${angle === opt.value ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Pages */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Apply Rotation To:</span>
              <button
                type="button"
                onClick={() => setPageSelection('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  pageSelection === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {files.length === 1
                    ? `All ${files[0].pageCount ?? 1} Pages`
                    : 'All Pages in Each PDF'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPageSelection('range')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  pageSelection === 'range'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Specific Page Range</span>
              </button>
            </div>

            {pageSelection === 'range' && (
              <div>
                <label htmlFor="rotatePageRange" className="block text-xs font-medium text-slate-700 mb-1">
                  {files.length === 1
                    ? `Enter pages to rotate (1–${files[0].pageCount ?? 1}) or click pages below`
                    : 'Enter pages to rotate in each PDF (e.g. 1, 3-4)'}
                </label>
                <input
                  id="rotatePageRange"
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 1, 3-4"
                />
              </div>
            )}
          </div>

          {previewTargetFile && (
            <PdfPreview
              file={previewTargetFile.file}
              title="Orientation Preview"
              subtitle={
                previewRotated
                  ? `Previewing +${angle}° clockwise rotation on ${targetedPreviewPages.length} of ${previewMaxPages} page(s)`
                  : `Original orientation (${previewTargetFile.name})`
              }
              markedPageNumbers={pageSelection === 'range' ? targetedPreviewPages : []}
              markVariant="select"
              markBadgeText={previewRotated ? `+${angle}°` : 'Target'}
              getPageExtraRotation={(pageNum) =>
                previewRotated && targetedPreviewSet.has(pageNum) ? angle : 0
              }
              onPageClick={
                pageSelection === 'range'
                  ? (pageNum) =>
                      setPageRange((prev) =>
                        togglePageInRangeString(prev, pageNum, previewMaxPages)
                      )
                  : undefined
              }
              headerActions={
                <div className="flex flex-wrap items-center gap-2">
                  {files.length > 1 && (
                    <select
                      aria-label="Select queued PDF to preview"
                      value={safePreviewFileIdx}
                      onChange={(e) => setPreviewFileIdx(Number(e.target.value))}
                      className="text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-md max-w-[160px] truncate"
                    >
                      {files.map((item, idx) => (
                        <option key={item.id} value={idx}>
                          {idx + 1}. {item.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div
                    role="group"
                    aria-label="Rotation preview state"
                    className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewRotated(false)}
                      className={`px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                        !previewRotated
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Before (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRotated(true)}
                      className={`px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                        previewRotated
                          ? 'bg-white text-blue-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      After (+{angle}°)
                    </button>
                  </div>
                </div>
              }
            />
          )}

          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleRotate}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              {files.length > 1 ? `Rotate ${files.length} PDFs Sequentially` : t('tool.rotate.button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

