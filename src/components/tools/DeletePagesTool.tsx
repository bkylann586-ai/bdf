import React, { useState, useEffect, useRef } from 'react';
import { FileText, FileMinus, AlertCircle } from 'lucide-react';
import { ProcessingFile, ProcessingResult } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { PdfPreview } from '../PdfPreview';
import { deletePagesFromPdf } from '../../lib/deletePagesPdf';
import {
  formatBytes,
  getPdfPageCount,
  parsePageRange,
  togglePageInRangeString,
} from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const DeletePagesTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [pageRange, setPageRange] = useState('1');
  const [previewViewTab, setPreviewViewTab] = useState<'all' | 'kept'>('all');
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
    setPageRange(pageCount > 1 ? String(pageCount) : '1');
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.deletePages.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('delete-pdf-pages');
    try {
      const sample = await createSamplePdf('Quarterly Report Draft', 5);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  // Live preview of how many pages will be removed / kept
  let previewRemoveCount = 0;
  let previewError = '';
  let markedDeletePages: number[] = [];
  if (file?.pageCount && pageRange.trim()) {
    try {
      const indices = parsePageRange(pageRange, file.pageCount);
      markedDeletePages = indices.map((idx) => idx + 1);
      previewRemoveCount = markedDeletePages.length;
      if (previewRemoveCount >= file.pageCount) {
        previewError = 'At least 1 page must remain in the final PDF.';
      }
    } catch (err: any) {
      previewError = err.message;
    }
  }

  const handleDelete = async () => {
    if (!file) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 3, message: t('progress.processing') });
    trackToolStart('delete-pdf-pages');
    const startTime = Date.now();

    try {
      const deleteRes = await deletePagesFromPdf(
        file,
        { pageRange },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(deleteRes);
      setStatus('success');
      trackToolSuccess('delete-pdf-pages', {
        durationMs: Date.now() - startTime,
        pageCount: deleteRes.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to delete pages.');
      trackToolError('delete-pdf-pages', err.name || 'DeletePagesError');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setFile(null);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        originalFile={file?.file}
        onReset={handleReset}
        title={t('tool.deletePages.successTitle')}
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
        operationTitle={t('tool.deletePages.title')}
      />
    );
  }

  const totalPages = file?.pageCount || 1;
  const markedDeleteSet = new Set(markedDeletePages);
  const keptPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => !markedDeleteSet.has(p)
  );
  const remainingCount = Math.max(0, totalPages - previewRemoveCount);

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
            sampleLabel="Load a 5-page sample PDF to remove pages"
            helperText="Select 1 PDF file (up to 250 MB) to strip blank, duplicate, or unwanted pages."
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
          <div className="flex items-center justify-between p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#102A56] text-[#38BDF8] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#17243A] truncate">{file.name}</p>
                <p className="text-xs text-[#64748B] font-mono tabular-nums">
                  {formatBytes(file.size)} · {totalPages} {totalPages === 1 ? 'page' : 'pages'} total
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

          {totalPages === 1 ? (
            <div role="alert" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              This document only contains 1 page. At least 1 page must remain in a valid PDF, so no pages can be deleted.
            </div>
          ) : (
            <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
              <div>
                <label htmlFor="deleteRangeInput" className="block text-xs font-semibold text-[#17243A] mb-1.5">
                  Pages or Ranges to Delete (1–{totalPages})
                </label>
                <input
                  id="deleteRangeInput"
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[#17243A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none font-mono"
                  placeholder="e.g. 1, 3-4"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                <span>Quick select:</span>
                <button
                  type="button"
                  onClick={() => setPageRange('1')}
                  className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] text-[#2563EB] font-semibold cursor-pointer"
                >
                  Cover Page (1)
                </button>
                <button
                  type="button"
                  onClick={() => setPageRange(String(totalPages))}
                  className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] text-[#2563EB] font-semibold cursor-pointer"
                >
                  Last Page ({totalPages})
                </button>
                {totalPages >= 3 && (
                  <button
                    type="button"
                    onClick={() => setPageRange(`2-${totalPages - 1}`)}
                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] text-[#2563EB] font-semibold cursor-pointer"
                  >
                    Middle Pages (2–{totalPages - 1})
                  </button>
                )}
              </div>

              {!previewError && previewRemoveCount > 0 && (
                <p className="text-xs text-[#17243A] font-medium">
                  Preview: Removing <span className="font-mono font-bold text-red-600">{previewRemoveCount}</span> page(s) ·{' '}
                  <span className="font-mono font-bold text-emerald-700">{remainingCount}</span> page(s) will be kept.
                </p>
              )}
              {previewError && (
                <p className="text-xs text-red-600">{previewError}</p>
              )}
            </div>
          )}

          {/* Interactive Page Preview (Before & Resulting Pages Preview) */}
          <PdfPreview
            file={file.file}
            title="Select & Preview Pages"
            subtitle={
              totalPages > 1
                ? 'Click any page to mark/unmark for deletion before saving'
                : '1 page total'
            }
            pageOrder={
              previewViewTab === 'kept' && keptPages.length > 0 ? keptPages : undefined
            }
            markedPageNumbers={previewViewTab === 'all' ? markedDeletePages : []}
            markVariant="delete"
            markBadgeText="Delete"
            unmarkedBadgeText={previewViewTab === 'all' ? 'Keep' : undefined}
            onPageClick={
              previewViewTab === 'all' && totalPages > 1
                ? (pageNum) =>
                    setPageRange((prev) =>
                      togglePageInRangeString(prev, pageNum, totalPages, {
                        minRemaining: 1,
                      })
                    )
                : undefined
            }
            headerActions={
              totalPages > 1 ? (
                <div
                  role="group"
                  aria-label="Deletion preview filter"
                  className="inline-flex items-center p-0.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-lg text-[11px] font-medium"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewViewTab('all')}
                    className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      previewViewTab === 'all'
                        ? 'bg-white text-[#102A56] shadow-xs font-semibold'
                        : 'text-[#64748B] hover:text-[#102A56]'
                    }`}
                  >
                    Before ({totalPages})
                  </button>
                  <button
                    type="button"
                    disabled={keptPages.length === 0}
                    onClick={() => setPreviewViewTab('kept')}
                    className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap disabled:opacity-40 cursor-pointer ${
                      previewViewTab === 'kept'
                        ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                        : 'text-[#64748B] hover:text-[#102A56]'
                    }`}
                  >
                    After ({keptPages.length})
                  </button>
                </div>
              ) : undefined
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
              disabled={totalPages === 1}
              onClick={handleDelete}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileMinus className="w-4 h-4" />
              <span>{t('tool.deletePages.button')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
