import React, { useState, useEffect, useRef } from 'react';
import { Stamp, AlertCircle, Layers } from 'lucide-react';
import {
  BatchProgressItem,
  ProcessingFile,
  ProcessingResult,
  WatermarkColor,
  WatermarkPosition,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { BatchFileQueue } from '../BatchFileQueue';
import { BatchSuccessDownload } from '../BatchSuccessDownload';
import { PdfPreview } from '../PdfPreview';
import { addWatermarkToPdf } from '../../lib/watermarkPdf';
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

export const WatermarkPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [text, setText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<WatermarkPosition>('diagonal');
  const [color, setColor] = useState<WatermarkColor>('slate');
  const [opacity, setOpacity] = useState(0.28);
  const [fontSize, setFontSize] = useState(48);
  const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('1');
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

    const wasEmpty = filesRef.current.length === 0;
    setStatus('idle');
    setResult(null);
    setBatchItems(null);
    setBatchZip(null);
    setFiles((prev) => [...prev, ...validItems]);

    if (wasEmpty) {
      const firstCount = validItems[0].pageCount ?? 1;
      setPageRange(firstCount > 1 ? `1-${firstCount}` : '1');
    }
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.watermark.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setErrorMessage(null);
  };

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('watermark-pdf');
    try {
      const [sample1, sample2] = await Promise.all([
        createSamplePdf('Client Proposal Contract', 3),
        createSamplePdf('Vendor Nondisclosure Agreement', 2),
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

  const handleApplyWatermark = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setStatus('processing');
    setBatchProgressItems(createBatchProgressItems(files));
    setCurrentFileIndex(1);
    setProgress({ current: 0, total: Math.max(1, files.length * 100), message: t('progress.processing') });
    trackToolStart('watermark-pdf');
    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const summary = await runSequentialBatch(
        files,
        (fileItem, onItemProgress) =>
          addWatermarkToPdf(
            fileItem,
            {
              text,
              opacity,
              fontSize,
              position,
              color,
              pageSelection,
              pageRange,
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
        setErrorMessage(firstError || 'Failed to watermark selected PDFs.');
        trackToolError('watermark-pdf', 'BatchWatermarkFailed');
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
          message: 'Packaging watermarked PDFs into ZIP archive...',
        });
        const zipSummary = await packageBatchPdfsToZip(summary.items, 'watermarked-pdfs-batch.zip');
        setResult(null);
        setBatchItems(summary.items);
        setBatchZip(zipSummary);
        setStatus('success');
      }

      trackToolSuccess('watermark-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: totalPages,
      });
    } catch (err: any) {
      abortControllerRef.current = null;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to watermark PDF.');
      trackToolError('watermark-pdf', err.name || 'WatermarkError');
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
        title={t('tool.watermark.successTitle')}
        relatedToolPath="/compress-pdf"
        relatedToolName="Compress PDF"
      />
    );
  }

  if (status === 'success' && batchItems) {
    return (
      <BatchSuccessDownload
        title="Batch Watermarking Complete"
        items={batchItems}
        zipSummary={batchZip}
        onReset={handleReset}
        relatedToolPath="/compress-pdf"
        relatedToolName="Compress PDF"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.watermark.title')}
        batchItems={batchProgressItems}
        currentFileIndex={currentFileIndex}
        totalFiles={files.length}
        itemLabel="PDF"
        onCancel={files.length > 1 ? handleCancelBatch : undefined}
      />
    );
  }

  const presets = ['CONFIDENTIAL', 'DRAFT', 'COPY', 'DO NOT DISTRIBUTE'];

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
            sampleLabel="Load 2 sample PDFs to stamp"
            helperText="Select 1 or more PDF files (up to 250 MB total) to add custom diagonal, centered, or tiled text stamps."
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

          {/* Watermark Text + Quick Presets */}
          <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <label htmlFor="watermarkTextInput" className="block text-xs font-semibold text-[#17243A]">
              Watermark Text (max 80 characters)
            </label>
            <input
              id="watermarkTextInput"
              type="text"
              maxLength={80}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none font-semibold"
              placeholder="e.g. CONFIDENTIAL"
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-[#64748B]">Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setText(preset)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                    text === preset
                      ? 'bg-[#102A56] text-white border-[#102A56]'
                      : 'bg-white text-[#17243A] border-[#E2E8F0] hover:border-[#2563EB]/50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Layout / Color / Size / Opacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <label htmlFor="watermarkPosition" className="block text-xs font-semibold text-[#17243A] mb-2">
                Layout Style
              </label>
              <select
                id="watermarkPosition"
                value={position}
                onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
                className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
              >
                <option value="diagonal">Diagonal (45° across center)</option>
                <option value="center">Centered Horizontal</option>
                <option value="tiled">Tiled 2×3 Grid</option>
              </select>
            </div>

            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <label htmlFor="watermarkColor" className="block text-xs font-semibold text-[#17243A] mb-2">
                Ink Color
              </label>
              <select
                id="watermarkColor"
                value={color}
                onChange={(e) => setColor(e.target.value as WatermarkColor)}
                className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
              >
                <option value="slate">Neutral Slate Gray</option>
                <option value="red">Alert Crimson Red</option>
                <option value="blue">Classic Navy Blue</option>
              </select>
            </div>

            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="watermarkOpacity" className="text-xs font-semibold text-[#17243A]">
                  Transparency (Opacity)
                </label>
                <span className="text-xs font-mono text-[#102A56] font-bold">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                id="watermarkOpacity"
                type="range"
                min={0.15}
                max={0.65}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
            </div>

            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="watermarkSize" className="text-xs font-semibold text-[#17243A]">
                  Base Font Size
                </label>
                <span className="text-xs font-mono text-[#102A56] font-bold">{fontSize} pt</span>
              </div>
              <input
                id="watermarkSize"
                type="range"
                min={28}
                max={64}
                step={4}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-[#2563EB]"
              />
            </div>
          </div>

          {/* Target Pages */}
          <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[#17243A]">Apply Stamp To:</span>
              <button
                type="button"
                onClick={() => setPageSelection('all')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  pageSelection === 'all'
                    ? 'bg-[#102A56] text-white border-[#102A56]'
                    : 'bg-white text-[#17243A] border-[#E2E8F0] hover:border-[#2563EB]/40'
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  pageSelection === 'range'
                    ? 'bg-[#102A56] text-white border-[#102A56]'
                    : 'bg-white text-[#17243A] border-[#E2E8F0] hover:border-[#2563EB]/40'
                }`}
              >
                <span>Specific Page Range</span>
              </button>
            </div>

            {pageSelection === 'range' && (
              <div>
                <label htmlFor="watermarkPageRange" className="block text-xs font-medium text-[#17243A] mb-1.5">
                  {files.length === 1
                    ? `Enter pages to stamp (1–${files[0].pageCount ?? 1})`
                    : 'Enter pages to stamp in each PDF (e.g. 1-3)'}
                </label>
                <input
                  id="watermarkPageRange"
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none font-mono"
                  placeholder="e.g. 1-3"
                />
              </div>
            )}
          </div>

          {files[0] && (
            <PdfPreview
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
              onClick={handleApplyWatermark}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Stamp className="w-4 h-4" />
              <span>
                {files.length > 1
                  ? `Watermark ${files.length} PDFs Sequentially`
                  : t('tool.watermark.button')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

