import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ArrowUpDown,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ProcessingFile, ProcessingResult } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { reorderPdfPages } from '../../lib/reorderPagesPdf';
import { formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const ReorderPagesTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleFileSelected = async (files: File[]) => {
    if (statusRef.current === 'processing' || statusRef.current === 'success') return;
    if (files.length === 0) return;
    setErrorMessage(null);

    const validation = validateSelectedFiles(files, {
      accept: 'application/pdf,.pdf',
      multiple: false,
    });

    const errorParts: string[] = [];
    if (validation.errorMessage) {
      errorParts.push(validation.errorMessage);
    }
    if (validation.validFiles.length === 0) {
      if (errorParts.length > 0) setErrorMessage(errorParts.join(' '));
      return;
    }

    const selected = validation.validFiles[0];
    const id = `${selected.name}-${Date.now()}`;

    let pageCount = 1;
    try {
      pageCount = await getPdfPageCount(selected);
    } catch (e: any) {
      errorParts.push(`${e?.message || 'Failed to read PDF.'}`);
      setErrorMessage(errorParts.join(' '));
      return;
    }

    if (errorParts.length > 0) {
      setErrorMessage(errorParts.join(' '));
    }

    setStatus('idle');
    setResult(null);
    setFile({
      id,
      file: selected,
      name: selected.name,
      size: selected.size,
      type: selected.type,
      pageCount,
    });
    setPageOrder(Array.from({ length: pageCount }, (_, i) => i + 1));
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.reorderPages.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('reorder-pdf-pages');
    try {
      const sample = await createSamplePdf('Board Meeting Exhibits', 5);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pageOrder.length) return;
    setPageOrder((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleReverseOrder = () => {
    setPageOrder((prev) => [...prev].reverse());
  };

  const handleResetOrder = () => {
    if (!file?.pageCount) return;
    setPageOrder(Array.from({ length: file.pageCount }, (_, i) => i + 1));
  };

  const handleRemovePage = (index: number) => {
    if (pageOrder.length <= 1) return;
    setPageOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!file || pageOrder.length === 0) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 3, message: t('progress.processing') });
    trackToolStart('reorder-pdf-pages');
    const startTime = Date.now();

    try {
      const res = await reorderPdfPages(
        file,
        { pageOrder },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(res);
      setStatus('success');
      trackToolSuccess('reorder-pdf-pages', {
        durationMs: Date.now() - startTime,
        pageCount: res.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to reorder PDF pages.');
      trackToolError('reorder-pdf-pages', err.name || 'ReorderError');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setFile(null);
    setPageOrder([]);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={t('tool.reorderPages.successTitle')}
        relatedToolPath="/add-page-numbers"
        relatedToolName="Add Page Numbers"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.reorderPages.title')}
      />
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      {!file ? (
        <div className="space-y-3">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={false}
            delegateValidation={true}
            onFilesSelected={handleFileSelected}
            onSampleRequested={handleLoadSample}
            sampleLabel="Load a 5-page sample PDF to rearrange"
            helperText="Select 1 PDF file (up to 250 MB) to swap, sort, or reverse page sequence."
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
          {/* File Overview */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {formatBytes(file.size)} · Keeping {pageOrder.length} of {file.pageCount} page(s)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-900 underline shrink-0"
            >
              Choose different file
            </button>
          </div>

          {/* Bulk Order Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <p className="text-xs text-slate-600">
              Use the Up and Down buttons to reorder pages cleanly before saving.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReverseOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Reverse Order</span>
              </button>
              <button
                type="button"
                onClick={handleResetOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Page Sequence List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {pageOrder.map((origPage, idx) => (
              <div
                key={`${origPage}-${idx}`}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">
                      Original Page {origPage}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Output position {idx + 1} of {pageOrder.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => movePage(idx, -1)}
                    aria-label={`Move original page ${origPage} up`}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pageOrder.length - 1}
                    onClick={() => movePage(idx, 1)}
                    aria-label={`Move original page ${origPage} down`}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pageOrder.length <= 1}
                    onClick={() => handleRemovePage(idx)}
                    aria-label={`Remove original page ${origPage} from sequence`}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded disabled:opacity-30 disabled:pointer-events-none ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              {t('tool.reorderPages.button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
