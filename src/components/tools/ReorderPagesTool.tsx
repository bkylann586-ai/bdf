import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ArrowUpDown,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ProcessingFile, ProcessingResult } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { PdfPreview } from '../PdfPreview';
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
  const [previewTab, setPreviewTab] = useState<'new' | 'original'>('new');
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

    const validation = await validateSelectedFiles(files, {
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
        originalFile={file?.file}
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
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
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
            <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Overview */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#102A56] text-[#38BDF8] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#17243A] truncate">{file.name}</p>
                <p className="text-xs text-[#64748B] font-mono tabular-nums">
                  {formatBytes(file.size)} · Keeping {pageOrder.length} of {file.pageCount} page(s)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[#64748B] hover:text-[#102A56] bg-white border border-[#E2E8F0] hover:border-[#2563EB]/40 rounded-lg shrink-0 cursor-pointer transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Bulk Order Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#64748B]">
              Arrange pages visually using the controls below each thumbnail, or switch between New Order and Original.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReverseOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] text-xs font-semibold text-[#17243A] bg-[#F4F7FB] border border-[#E2E8F0] hover:border-[#2563EB]/40 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Reverse Order</span>
              </button>
              <button
                type="button"
                onClick={handleResetOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] text-xs font-semibold text-[#17243A] bg-[#F4F7FB] border border-[#E2E8F0] hover:border-[#2563EB]/40 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Visual Reorder & Before/After Sequence Preview */}
          <PdfPreview
            file={file.file}
            title="Visual Page Sequence"
            subtitle={
              previewTab === 'new'
                ? `Output order: ${pageOrder.length} of ${file.pageCount} page(s)`
                : `Original order: ${file.pageCount} page(s)`
            }
            pageOrder={previewTab === 'new' ? pageOrder : undefined}
            getPageLabel={(origPage) => `Orig p.${origPage}`}
            headerActions={
              <div
                role="group"
                aria-label="Page sequence preview"
                className="inline-flex items-center p-0.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-lg text-[11px] font-medium"
              >
                <button
                  type="button"
                  onClick={() => setPreviewTab('new')}
                  className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    previewTab === 'new'
                      ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                      : 'text-[#64748B] hover:text-[#102A56]'
                  }`}
                >
                  New Order ({pageOrder.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('original')}
                  className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    previewTab === 'original'
                      ? 'bg-white text-[#102A56] shadow-xs font-semibold'
                      : 'text-[#64748B] hover:text-[#102A56]'
                  }`}
                >
                  Before ({file.pageCount})
                </button>
              </div>
            }
            renderPageActions={
              previewTab === 'new'
                ? (origPage, seqIdx, totalInSeq) => (
                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={seqIdx === 0}
                          onClick={() => movePage(seqIdx, -1)}
                          aria-label={`Move original page ${origPage} earlier`}
                          title="Move earlier"
                          className="p-1 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F4F7FB] rounded-md disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={seqIdx === totalInSeq - 1}
                          onClick={() => movePage(seqIdx, 1)}
                          aria-label={`Move original page ${origPage} later`}
                          title="Move later"
                          className="p-1 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F4F7FB] rounded-md disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={totalInSeq <= 1}
                        onClick={() => handleRemovePage(seqIdx)}
                        aria-label={`Remove original page ${origPage} from sequence`}
                        title="Remove page"
                        className="p-1 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                : undefined
            }
          />

          {errorMessage && (
            <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              {t('tool.reorderPages.button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
