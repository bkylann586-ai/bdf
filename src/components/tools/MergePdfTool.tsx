import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, FileText, AlertCircle } from 'lucide-react';
import { BatchProgressItem, ProcessingFile, ProcessingResult } from '../../types';
import { DropZone } from '../DropZone';
import { InlineDropTarget } from '../InlineDropTarget';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { mergePdfFiles } from '../../lib/mergePdf';
import {
  createBatchProgressItems,
  updateBatchProgressItems,
} from '../../lib/batchProcessing';
import { formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const MergePdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [outputName, setOutputName] = useState('pdfquick-merged.pdf');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [batchProgressItems, setBatchProgressItems] = useState<BatchProgressItem[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(1);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const filesRef = useRef<ProcessingFile[]>([]);
  const statusRef = useRef(status);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleFilesSelected = async (newFiles: File[]) => {
    if (statusRef.current === 'processing' || statusRef.current === 'success') return;
    setErrorMessage(null);
    const currentTotalBytes = filesRef.current.reduce((acc, f) => acc + f.size, 0);
    const validation = await validateSelectedFiles(newFiles, {
      accept: 'application/pdf,.pdf',
      multiple: true,
      existingTotalBytes: currentTotalBytes,
    });

    const errorParts: string[] = [];
    if (validation.errorMessage) {
      errorParts.push(validation.errorMessage);
    }

    const mapped: ProcessingFile[] = [];

    for (const file of validation.validFiles) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      try {
        const pages = await getPdfPageCount(file);
        mapped.push({
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          pageCount: pages > 0 ? pages : undefined,
        });
      } catch (e: any) {
        errorParts.push(`"${file.name}": ${e?.message || 'Failed to read PDF.'}`);
      }
    }

    if (errorParts.length > 0) {
      setErrorMessage(errorParts.join(' '));
    }

    if (mapped.length > 0) {
      if (statusRef.current === 'error') {
        setStatus('idle');
      }
      setFiles((prev) => {
        const updated = [...prev, ...mapped];
        filesRef.current = updated;
        return updated;
      });
    }
  };

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.merge.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSamples = async () => {
    setErrorMessage(null);
    trackSampleUse('merge-pdf');
    try {
      const sample1 = await createSamplePdf('Contract Part A', 2);
      const sample2 = await createSamplePdf('Appendix Part B', 2);
      await handleFilesSelected([sample1, sample2]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample files: ${err.message}`);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    setFiles((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = item;
      return copy;
    });
  };

  const removeItem = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setErrorMessage(null);
  };

  const handleCancelMerge = () => {
    abortControllerRef.current?.abort();
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMessage(t('tool.merge.minWarning'));
      return;
    }

    setErrorMessage(null);
    setStatus('processing');
    setBatchProgressItems(createBatchProgressItems(files));
    setCurrentFileIndex(1);
    setProgress({
      current: 0,
      total: files.length * 100 + 20,
      message: t('progress.processing'),
    });
    trackToolStart('merge-pdf');
    const startTime = Date.now();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const mergeRes = await mergePdfFiles(
        files,
        outputName,
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        },
        {
          signal: controller.signal,
          onItemStatus: (index, itemStatus, itemPercent, detail) => {
            setCurrentFileIndex(index + 1);
            setBatchProgressItems((prev) =>
              updateBatchProgressItems(prev, index, itemStatus, itemPercent, detail)
            );
          },
        }
      );
      abortControllerRef.current = null;
      setResult(mergeRes);
      setStatus('success');
      trackToolSuccess('merge-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: mergeRes.pageCount,
      });
    } catch (err: any) {
      abortControllerRef.current = null;
      if (err?.name === 'AbortError') {
        setStatus('idle');
        setBatchProgressItems([]);
        setErrorMessage('Merge batch was cancelled. Your queued PDFs remain ready.');
        return;
      }
      setStatus('error');
      setErrorMessage(err.message || 'Failed to merge documents.');
      trackToolError('merge-pdf', err.name || 'MergeError');
    }
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStatus('idle');
    setResult(null);
    setBatchProgressItems([]);
    setFiles([]);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={t('tool.merge.successTitle')}
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
        operationTitle={t('tool.merge.title')}
        batchItems={batchProgressItems}
        currentFileIndex={currentFileIndex}
        totalFiles={files.length}
        itemLabel="PDF"
        onCancel={handleCancelMerge}
      />
    );
  }

  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 0), 0);
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      {files.length === 0 ? (
        <div className="space-y-3">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={true}
            existingTotalBytes={totalBytes}
            delegateValidation={true}
            onFilesSelected={handleFilesSelected}
            onSampleRequested={handleLoadSamples}
            sampleLabel={t('dropzone.sample')}
            helperText={t('dropzone.helper')}
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
          {/* Summary & Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {files.length} {files.length === 1 ? 'Document' : 'Documents'} Queued
              </h3>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                Total size: {formatBytes(totalBytes)} · Total pages: {totalPages}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('tool.merge.addMore')}</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  aria-label={t('tool.merge.addMore')}
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t('tool.merge.clearAll')}
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 font-mono">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {formatBytes(file.size)}
                      {file.pageCount && ` · ${file.pageCount} pages`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-200"
                    title="Move up in merge sequence"
                    aria-label={`Move ${file.name} up`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === files.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-200"
                    title="Move down in merge sequence"
                    aria-label={`Move ${file.name} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(file.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 ml-1"
                    title="Remove document from queue"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <InlineDropTarget
            accept="application/pdf,.pdf"
            multiple={true}
            label="Drag and drop more PDFs here or click to add"
            dragActiveLabel="Release to append PDFs to merge queue"
            onFilesSelected={handleFilesSelected}
          />

          {/* Merge Options */}
          <div className="pt-4 border-t border-slate-200">
            <div className="max-w-md">
              <label htmlFor="outputName" className="block text-xs font-semibold text-slate-700 mb-1">
                Output File Name
              </label>
              <input
                id="outputName"
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="pdfquick-merged.pdf"
              />
            </div>
          </div>

          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-500">
              Files are processed in the order shown above.
            </span>

            <button
              type="button"
              onClick={handleMerge}
              disabled={files.length < 2}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {t('tool.merge.button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
