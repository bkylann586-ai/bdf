import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, AlertCircle, Info } from 'lucide-react';
import { ProcessingFile, ProcessingResult, CompressLevel } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { BatchFileQueue } from '../BatchFileQueue';
import { BatchSuccessDownload } from '../BatchSuccessDownload';
import { compressPdfFile } from '../../lib/compressPdf';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';
import {
  BatchItemOutcome,
  BatchPdfZipSummary,
  packageBatchPdfsToZip,
  runSequentialBatch,
  validateAndInspectPdfQueue,
} from '../../lib/batchProcessing';

export const CompressPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [level, setLevel] = useState<CompressLevel>('recommended');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
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

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.compress.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    setErrorMessage(null);
  };

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('compress-pdf');
    try {
      const [sample1, sample2] = await Promise.all([
        createSamplePdf('Scanned Receipt Packet', 3),
        createSamplePdf('Quarterly Field Report', 2),
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

  const handleCompress = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: Math.max(1, files.length * 100), message: t('progress.processing') });
    trackToolStart('compress-pdf');
    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const summary = await runSequentialBatch(
        files,
        (fileItem, onItemProgress) => compressPdfFile(fileItem, { level }, onItemProgress),
        {
          onProgress: (curr, tot, msg) => {
            setProgress({ current: curr, total: tot, message: msg });
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
        setErrorMessage(firstError || 'Failed to compress selected PDF documents.');
        trackToolError('compress-pdf', 'BatchCompressFailed');
        return;
      }

      const totalPagesProcessed = summary.items.reduce(
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
          message: 'Packaging compressed PDFs into ZIP archive...',
        });
        const zipSummary = await packageBatchPdfsToZip(summary.items, 'compressed-pdfs-batch.zip');
        setResult(null);
        setBatchItems(summary.items);
        setBatchZip(zipSummary);
        setStatus('success');
      }

      trackToolSuccess('compress-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: totalPagesProcessed,
      });
    } catch (err: any) {
      abortControllerRef.current = null;
      setStatus('error');
      setErrorMessage(err.message || 'Failed to compress document.');
      trackToolError('compress-pdf', err.name || 'CompressError');
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
    const isSmaller = typeof result.originalSize === 'number' && result.fileSize < result.originalSize;
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={isSmaller ? t('tool.compress.successTitle') : t('tool.compress.reportTitle')}
        relatedToolPath="/split-pdf"
        relatedToolName="Split PDF"
      />
    );
  }

  if (status === 'success' && batchItems) {
    return (
      <BatchSuccessDownload
        title="Batch Compression Complete"
        items={batchItems}
        zipSummary={batchZip}
        onReset={handleReset}
        showSizeComparison={true}
        relatedToolPath="/split-pdf"
        relatedToolName="Split PDF"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.compress.title')}
        onCancel={files.length > 1 ? handleCancelBatch : undefined}
      />
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
            sampleLabel="Load 2 sample PDFs for batch compression"
            helperText="Select 1 or more PDF files (up to 250 MB total). Multiple PDFs compress sequentially inside your browser."
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

          {/* Honest Notice */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-900">How browser compression works: </strong>
              Scanned documents and PDFs containing high-resolution images benefit the most from optimization. Plain vector and text-only documents are often already compact; lossless re-encoding removes orphaned data and stream redundancies.
            </div>
          </div>

          {/* Optimization Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Compression Level {files.length > 1 ? '(applied to all queued PDFs)' : ''}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setLevel('recommended')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  level === 'recommended'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Balanced (Recommended)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Best balance of visual clarity and file size reduction. Ideal for standard business documents and scans.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('extreme')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  level === 'extreme'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Maximum Reduction</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Aggressive downsampling for small email attachments and fast mobile web sharing.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('lossless')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  level === 'lossless'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Lossless Re-encode</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Preserves original vector clarity 100%. Re-encodes object streams and strips obsolete catalog objects.
                </p>
              </button>
            </div>
          </div>

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
              onClick={handleCompress}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Minimize2 className="w-4 h-4" />
              <span>
                {files.length > 1 ? `Compress ${files.length} PDFs Sequentially` : 'Compress PDF Now'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

