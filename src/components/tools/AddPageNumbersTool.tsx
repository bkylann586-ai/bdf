import React, { useState, useEffect, useRef } from 'react';
import { Hash, AlertCircle } from 'lucide-react';
import {
  BatchProgressItem,
  PageNumberFormat,
  PageNumberPosition,
  ProcessingFile,
  ProcessingResult,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { BatchFileQueue } from '../BatchFileQueue';
import { BatchSuccessDownload } from '../BatchSuccessDownload';
import { LazyPdfPreview } from '../LazyPdfPreview';
import { addPageNumbersToPdf } from '../../lib/addPageNumbersPdf';
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

export const AddPageNumbersTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page_n_of_total');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [skipFirstPage, setSkipFirstPage] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [batchProgressItems, setBatchProgressItems] = useState<BatchProgressItem[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(1);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [batchItems, setBatchItems] = useState<BatchItemOutcome<ProcessingResult>[] | null>(null);
  const [batchZip, setBatchZip] = useState<BatchPdfZipSummary | null>(null);
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

    setStatus('idle');
    setResult(null);
    setBatchItems(null);
    setBatchZip(null);
    setFiles((prev) => [...prev, ...validItems]);
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.pageNumbers.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setErrorMessage(null);
  };

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('add-page-numbers');
    try {
      const [sample1, sample2] = await Promise.all([
        createSamplePdf('Legal Filing Brief', 4),
        createSamplePdf('Supporting Exhibit A', 3),
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

  const handleApplyNumbers = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setStatus('processing');
    setBatchProgressItems(createBatchProgressItems(files));
    setCurrentFileIndex(1);
    setProgress({ current: 0, total: Math.max(1, files.length * 100), message: t('progress.processing') });
    trackToolStart('add-page-numbers');
    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const summary = await runSequentialBatch(
        files,
        (fileItem, onItemProgress) =>
          addPageNumbersToPdf(
            fileItem,
            {
              position,
              format,
              startNumber,
              skipFirstPage,
              fontSize,
            },
            onItemProgress
          ),
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
        setErrorMessage(firstError || 'Failed to add page numbers.');
        trackToolError('add-page-numbers', 'BatchPageNumbersFailed');
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
          message: 'Packaging numbered PDFs into ZIP archive...',
        });
        const zipSummary = await packageBatchPdfsToZip(summary.items, 'numbered-pdfs-batch.zip');
        setResult(null);
        setBatchItems(summary.items);
        setBatchZip(zipSummary);
        setStatus('success');
      }

      trackToolSuccess('add-page-numbers', {
        durationMs: Date.now() - startTime,
        pageCount: totalPages,
      });
    } catch (err: any) {
      abortControllerRef.current = null;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to add page numbers.');
      trackToolError('add-page-numbers', err.name || 'PageNumbersError');
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
        title={t('tool.pageNumbers.successTitle')}
        relatedToolPath="/watermark-pdf"
        relatedToolName="Watermark PDF"
      />
    );
  }

  if (status === 'success' && batchItems) {
    return (
      <BatchSuccessDownload
        title="Batch Pagination Complete"
        items={batchItems}
        zipSummary={batchZip}
        onReset={handleReset}
        relatedToolPath="/watermark-pdf"
        relatedToolName="Watermark PDF"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.pageNumbers.title')}
        batchItems={batchProgressItems}
        currentFileIndex={currentFileIndex}
        totalFiles={files.length}
        itemLabel="PDF"
        onCancel={files.length > 1 ? handleCancelBatch : undefined}
      />
    );
  }

  const positions: { value: PageNumberPosition; label: string }[] = [
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
  ];

  const formats: { value: PageNumberFormat; label: string; example: string }[] = [
    { value: 'page_n_of_total', label: 'Page 1 of N', example: `Page ${startNumber} of ${files[0]?.pageCount || 4}` },
    { value: 'page_n', label: 'Page 1', example: `Page ${startNumber}` },
    { value: 'number', label: 'Number Only', example: `${startNumber}` },
  ];

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
      {files.length === 0 ? (
        <div className="space-y-3">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={true}
            delegateValidation={true}
            onFilesSelected={handleFilesSelected}
            onSampleRequested={handleLoadSample}
            sampleLabel="Load 2 sample PDFs to number pages"
            helperText="Select 1 or more PDF files (up to 250 MB total) to add sequential header or footer numbers."
          />
          {errorMessage && (
            <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position */}
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <label htmlFor="numberPosition" className="block text-xs font-semibold text-[#17243A] mb-2">
                Placement Position
              </label>
              <select
                id="numberPosition"
                value={position}
                onChange={(e) => setPosition(e.target.value as PageNumberPosition)}
                className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
              >
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <label htmlFor="numberFormat" className="block text-xs font-semibold text-[#17243A] mb-2">
                Label Format
              </label>
              <select
                id="numberFormat"
                value={format}
                onChange={(e) => setFormat(e.target.value as PageNumberFormat)}
                className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
              >
                {formats.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label} ({fmt.example})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Number */}
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <label htmlFor="startNumberInput" className="block text-xs font-semibold text-[#17243A] mb-2">
                Starting Page Number
              </label>
              <input
                id="startNumberInput"
                type="number"
                min={1}
                max={9999}
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none font-mono"
              />
            </div>

            {/* Font Size */}
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <label htmlFor="numberFontSize" className="block text-xs font-semibold text-[#17243A] mb-2">
                Font Size (pt)
              </label>
              <select
                id="numberFontSize"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
              >
                <option value={10}>10 pt (Compact)</option>
                <option value={11}>11 pt (Standard US Letter / A4)</option>
                <option value={12}>12 pt (Clear Legal)</option>
                <option value={14}>14 pt (Large Print)</option>
              </select>
            </div>
          </div>

          {/* Skip First Page */}
          <label className="flex items-center gap-2.5 p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#2563EB]/40 transition-colors">
            <input
              type="checkbox"
              checked={skipFirstPage}
              onChange={(e) => setSkipFirstPage(e.target.checked)}
              className="w-4 h-4 accent-[#2563EB] rounded border-[#E2E8F0]"
            />
            <span className="text-xs font-semibold text-[#17243A]">
              Skip cover page (leave Page 1 unnumbered and begin numbering on Page 2)
            </span>
          </label>

          {files[0] && (
            <LazyPdfPreview
              file={files[0].file}
              title="Inspect PDF Pages"
              subtitle={`Previewing ${files[0].name} (${files[0].pageCount ?? 1} page(s))`}
              collapsible={true}
              defaultOpen={false}
            />
          )}

          {errorMessage && (
            <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleApplyNumbers}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Hash className="w-4 h-4" />
              <span>
                {files.length > 1
                  ? `Number ${files.length} PDFs Sequentially`
                  : t('tool.pageNumbers.button')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

