import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileSearch,
  FileText,
  ScanText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  OcrLanguageCode,
  OcrMode,
  OcrPdfOptions,
  OcrPdfResult,
  ProcessingFile,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { OCR_LANGUAGE_OPTIONS, runPdfOcr } from '../../lib/ocrPdf';
import { downloadBlob, formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSampleScannedPdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import {
  trackToolError,
  trackToolStart,
  trackToolSuccess,
  trackSampleUse,
} from '../../lib/analytics';

export const OcrPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();

  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [language, setLanguage] = useState<OcrLanguageCode>('eng');
  const [mode, setMode] = useState<OcrMode>('hybrid');
  const [scale, setScale] = useState<number>(1.5);
  const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('1');

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 100, message: '' });
  const [result, setResult] = useState<OcrPdfResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedPageFilter, setSelectedPageFilter] = useState<number | 'all'>('all');
  const [textFilterQuery, setTextFilterQuery] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  const statusRef = useRef(status);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read PDF document.');
      return;
    }

    if (errorParts.length > 0) {
      setErrorMessage(errorParts.join(' '));
    }

    setResult(null);
    setStatus('idle');
    setSelectedPageFilter('all');
    setTextFilterQuery('');
    setFile({
      id,
      file: selected,
      name: selected.name,
      size: selected.size,
      type: selected.type || 'application/pdf',
      pageCount,
    });
    setPageRange(pageCount > 1 ? `1-${Math.min(5, pageCount)}` : '1');
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.ocrPdf.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('ocr-pdf');
    try {
      const sample = await createSampleScannedPdf();
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample scanned PDF: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleRunOcr = async () => {
    if (!file) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setStatus('processing');
    setProgress({
      current: 2,
      total: 100,
      message: 'Initializing client-side OCR workspace...',
    });
    trackToolStart('ocr-pdf');
    const startedAt = Date.now();

    try {
      const options: OcrPdfOptions = {
        language,
        mode,
        scale,
        pageSelection,
        pageRange,
      };

      const ocrResult = await runPdfOcr(file, options, {
        signal: controller.signal,
        onProgress: (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        },
      });

      setResult(ocrResult);
      setSelectedPageFilter('all');
      setTextFilterQuery('');
      setStatus('success');
      trackToolSuccess('ocr-pdf', {
        durationMs: Date.now() - startedAt,
        pageCount: ocrResult.totalProcessedPages,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStatus('idle');
        setErrorMessage('OCR run cancelled. Adjust settings or restart whenever ready.');
        return;
      }
      setStatus('error');
      setErrorMessage(err?.message || 'OCR recognition failed for this document.');
      trackToolError('ocr-pdf', err?.name || 'OcrError');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelOcr = () => {
    abortControllerRef.current?.abort();
  };

  const handleDownloadSearchablePdf = () => {
    if (!result) return;
    downloadBlob(result.searchablePdfBlob, result.searchablePdfFilename);
  };

  const handleDownloadText = () => {
    if (!result) return;
    const textBlob = new Blob([result.combinedText], {
      type: 'text/plain;charset=utf-8',
    });
    downloadBlob(textBlob, result.textFilename);
  };

  const handleCopyAllText = async () => {
    if (!result || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(displayedText || result.combinedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      setErrorMessage('Clipboard access was denied by browser permissions.');
    }
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    setFile(null);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
    setSelectedPageFilter('all');
    setTextFilterQuery('');
    setCopiedText(false);
  };

  const visiblePages = useMemo(() => {
    if (!result) return [];
    let pages = result.pages;
    if (selectedPageFilter !== 'all') {
      pages = pages.filter((p) => p.pageNumber === selectedPageFilter);
    }
    const q = textFilterQuery.trim().toLowerCase();
    if (q) {
      pages = pages.filter((p) => p.text.toLowerCase().includes(q));
    }
    return pages;
  }, [result, selectedPageFilter, textFilterQuery]);

  const displayedText = useMemo(() => {
    if (visiblePages.length === 0) return '';
    if (visiblePages.length === 1 && selectedPageFilter !== 'all') {
      return visiblePages[0].text || '(No text recognized on this page.)';
    }
    return visiblePages
      .map(
        (p) =>
          `=== Page ${p.pageNumber} (${p.source === 'ocr' ? `OCR · ${p.confidence ?? 0}% confidence` : 'Embedded Text'}) ===\n${
            p.text || '(No text detected on this page)'
          }`
      )
      .join('\n\n');
  }, [visiblePages, selectedPageFilter]);

  const containsArabicResult = /[\u0600-\u06FF]/.test(displayedText) || language.includes('ara');

  if (status === 'processing') {
    return (
      <div className="space-y-4">
        <ProcessingProgress
          current={progress.current}
          total={progress.total}
          message={progress.message}
          operationTitle={t('tool.ocrPdf.title')}
          stageName="Tesseract.js WASM"
        />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCancelOcr}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
          >
            Cancel OCR Processing
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success' && result) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header & Primary Export Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {t('tool.ocrPdf.successTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              <span>{result.totalProcessedPages} {result.totalProcessedPages === 1 ? 'page' : 'pages'} processed</span>
              <span aria-hidden="true"> · </span>
              <span>{result.totalWords.toLocaleString()} words extracted</span>
              {result.averageConfidence !== null && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{result.averageConfidence}% avg OCR confidence</span>
                </>
              )}
              <span aria-hidden="true"> · </span>
              <span>{(result.durationMs / 1000).toFixed(1)}s</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadSearchablePdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Searchable PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadText}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Save .TXT</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              OCR another PDF
            </button>
          </div>
        </div>

        <PerformanceMonitor
          variant="summary"
          durationMs={result.durationMs}
          inputBytes={file?.size}
          outputBytes={result.searchablePdfBlob.size}
        />

        {/* Quantitative Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-medium text-slate-500">OCR Scanned Pages</div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {result.ocrPageCount}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-medium text-slate-500">Existing Text Reused</div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {result.embeddedTextPageCount}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-medium text-slate-500">Total Characters</div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {result.totalCharacters.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-medium text-slate-500">Searchable PDF Size</div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {formatBytes(result.searchablePdfBlob.size)}
            </div>
          </div>
        </div>

        {/* Recognized Text Inspector */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPageFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                  selectedPageFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({result.pages.length})
              </button>
              {result.pages.map((p) => (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => setSelectedPageFilter(p.pageNumber)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors font-mono tabular-nums whitespace-nowrap ${
                    selectedPageFilter === p.pageNumber
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  P.{p.pageNumber}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={textFilterQuery}
                  onChange={(e) => setTextFilterQuery(e.target.value)}
                  placeholder="Filter extracted text..."
                  aria-label="Filter extracted text"
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                {textFilterQuery && (
                  <button
                    type="button"
                    onClick={() => setTextFilterQuery('')}
                    aria-label="Clear text filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyAllText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            dir={containsArabicResult ? 'rtl' : 'ltr'}
            value={
              displayedText ||
              'No pages matched your filter or no readable text was detected.'
            }
            aria-label="Extracted OCR text preview"
            rows={12}
            className="w-full p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
          />
        </div>
      </div>
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
            sampleLabel="Load a 2-page scanned sample PDF"
            helperText="Upload 1 scanned or image-based PDF (up to 250 MB). Tesseract.js OCR runs strictly inside your browser."
          />
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700"
            >
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
                <FileSearch className="w-5 h-5" />
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
              className="text-xs text-slate-600 hover:text-slate-900 underline ml-3 shrink-0 whitespace-nowrap"
            >
              Choose different file
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="ocrLanguageSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Document Language
              </label>
              <select
                id="ocrLanguageSelect"
                value={language}
                onChange={(e) => setLanguage(e.target.value as OcrLanguageCode)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {OCR_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ocrModeSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Recognition Strategy
              </label>
              <select
                id="ocrModeSelect"
                value={mode}
                onChange={(e) => setMode(e.target.value as OcrMode)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="hybrid">Smart Hybrid (OCR scans only)</option>
                <option value="force-ocr">Force OCR on all pages</option>
              </select>
            </div>

            <div>
              <label htmlFor="ocrScaleSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Scan Resolution
              </label>
              <select
                id="ocrScaleSelect"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={1.5}>Fast &amp; Light (1.5× / ~110 DPI)</option>
                <option value={2.0}>High Accuracy (2.0× / ~150 DPI)</option>
              </select>
            </div>

            <div>
              <label htmlFor="ocrPagesSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Pages to Process
              </label>
              <select
                id="ocrPagesSelect"
                value={pageSelection}
                onChange={(e) => setPageSelection(e.target.value as 'all' | 'range')}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Pages (1 to {file.pageCount})</option>
                <option value="range">Specific Page Range</option>
              </select>
            </div>
          </div>

          {pageSelection === 'range' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <label htmlFor="ocrRangeInput" className="block text-xs font-semibold text-slate-700 mb-1">
                Specify Pages (e.g. 1-3, 5)
              </label>
              <input
                id="ocrRangeInput"
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="e.g. 1-5"
              />
            </div>
          )}

          {/* Client-side Privacy & Model Download Transparency Note */}
          <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              OCR runs 100% locally in a WebAssembly worker inside your browser. On first run for a new language, Tesseract loads that language&apos;s compact dictionary locally from this site once and caches it in IndexedDB for offline reuse—your PDF pages and recognized text are never uploaded.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Action */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleRunOcr}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <ScanText className="w-4 h-4" />
              <span>{t('tool.ocrPdf.button')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
