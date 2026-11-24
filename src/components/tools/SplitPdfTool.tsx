import React, { useState, useEffect, useRef } from 'react';
import { FileText, Scissors, AlertCircle, Layers, FileCheck } from 'lucide-react';
import { ProcessingFile, ProcessingResult, SplitMode } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { splitPdfFile } from '../../lib/splitPdf';
import { formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const SplitPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [mode, setMode] = useState<SplitMode>('range');
  const [pageRange, setPageRange] = useState('1');
  const [chunkSize, setChunkSize] = useState(2);
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

    // Provide initial smart range based on document page count
    if (pageCount > 1) {
      setPageRange(`1-${Math.min(2, pageCount)}`);
    } else {
      setPageRange('1');
    }
  };

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.split.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('split-pdf');
    try {
      const sample = await createSamplePdf('Quarterly Report', 5);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 10, message: t('progress.processing') });
    trackToolStart('split-pdf');
    const startTime = Date.now();

    try {
      const splitRes = await splitPdfFile(
        file,
        {
          mode,
          pageRange,
          chunkSize,
        },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(splitRes);
      setStatus('success');
      trackToolSuccess('split-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: file.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to split document.');
      trackToolError('split-pdf', err.name || 'SplitError');
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
        onReset={handleReset}
        title={t('tool.split.successTitle')}
        relatedToolPath="/merge-pdf"
        relatedToolName="Merge PDF"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.split.title')}
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
            sampleLabel="Load a 5-page sample PDF for testing"
            helperText="Select 1 PDF file (up to 250 MB) to extract pages or divide into separate files."
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
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {formatBytes(file.size)} · {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} total
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-900 underline ml-3 shrink-0"
            >
              Choose different file
            </button>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Split Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  mode === 'range'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scissors className={`w-4 h-4 ${mode === 'range' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">Custom Page Range</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Extract specific pages (e.g. 1-3, 5) into 1 PDF.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('all')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  mode === 'all'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className={`w-4 h-4 ${mode === 'all' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">Separate Every Page</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Split into individual 1-page PDFs packaged in a ZIP.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('chunk')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  mode === 'chunk'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className={`w-4 h-4 ${mode === 'chunk' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">Split by Page Groups</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Split every N pages into equal sized parts in a ZIP.
                </p>
              </button>
            </div>
          </div>

          {/* Mode Configuration Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            {mode === 'range' && (
              <div>
                <label htmlFor="pageRangeInput" className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Pages or Ranges to Extract (Total Pages: {file.pageCount})
                </label>
                <input
                  id="pageRangeInput"
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 1-2, 4 or 2, 5"
                />
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <span>Examples:</span>
                  <button
                    type="button"
                    onClick={() => setPageRange('1')}
                    className="text-blue-600 hover:underline"
                  >
                    Page 1
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setPageRange(`1-${Math.min(2, file.pageCount || 1)}`)}
                    className="text-blue-600 hover:underline"
                  >
                    1-{Math.min(2, file.pageCount || 1)}
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setPageRange(`1-${file.pageCount || 1}`)}
                    className="text-blue-600 hover:underline"
                  >
                    All pages (1-{file.pageCount})
                  </button>
                </div>
              </div>
            )}

            {mode === 'all' && (
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-900 mb-1">Single page extraction</p>
                <p>
                  This will generate <strong className="font-mono tabular-nums">{file.pageCount}</strong> individual PDF documents (one per page) and package them neatly into a downloadable ZIP archive.
                </p>
              </div>
            )}

            {mode === 'chunk' && (
              <div>
                <label htmlFor="chunkSizeInput" className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Pages per Document
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="chunkSizeInput"
                    type="number"
                    min="1"
                    max={file.pageCount || 100}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 1)}
                    className="w-32 text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Yields approx. {Math.ceil((file.pageCount || 1) / Math.max(1, chunkSize))} separate files
                  </span>
                </div>
              </div>
            )}
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
              onClick={handleSplit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              {mode === 'range' ? 'Extract Selected Pages' : 'Split Document & Download'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
