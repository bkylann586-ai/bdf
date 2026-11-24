import React, { useState, useEffect, useRef } from 'react';
import { FileText, Hash, AlertCircle } from 'lucide-react';
import {
  PageNumberFormat,
  PageNumberPosition,
  ProcessingFile,
  ProcessingResult,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { addPageNumbersToPdf } from '../../lib/addPageNumbersPdf';
import { formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const AddPageNumbersTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page_n_of_total');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [skipFirstPage, setSkipFirstPage] = useState(false);
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
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.pageNumbers.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('add-page-numbers');
    try {
      const sample = await createSamplePdf('Legal Filing Brief', 4);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  const handleApplyNumbers = async () => {
    if (!file) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 3, message: t('progress.processing') });
    trackToolStart('add-page-numbers');
    const startTime = Date.now();

    try {
      const res = await addPageNumbersToPdf(
        file,
        {
          position,
          format,
          startNumber,
          skipFirstPage,
          fontSize,
        },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(res);
      setStatus('success');
      trackToolSuccess('add-page-numbers', {
        durationMs: Date.now() - startTime,
        pageCount: res.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to add page numbers.');
      trackToolError('add-page-numbers', err.name || 'PageNumbersError');
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
        title={t('tool.pageNumbers.successTitle')}
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
    { value: 'page_n_of_total', label: 'Page 1 of N', example: `Page ${startNumber} of ${file?.pageCount || 4}` },
    { value: 'page_n', label: 'Page 1', example: `Page ${startNumber}` },
    { value: 'number', label: 'Number Only', example: `${startNumber}` },
  ];

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
            sampleLabel="Load a 4-page sample PDF to number pages"
            helperText="Select 1 PDF file (up to 250 MB) to add sequential header or footer numbers."
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

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label htmlFor="numberPosition" className="block text-xs font-semibold text-slate-700 mb-2">
                Placement Position
              </label>
              <select
                id="numberPosition"
                value={position}
                onChange={(e) => setPosition(e.target.value as PageNumberPosition)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label htmlFor="numberFormat" className="block text-xs font-semibold text-slate-700 mb-2">
                Label Format
              </label>
              <select
                id="numberFormat"
                value={format}
                onChange={(e) => setFormat(e.target.value as PageNumberFormat)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {formats.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label} ({fmt.example})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Number */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label htmlFor="startNumberInput" className="block text-xs font-semibold text-slate-700 mb-2">
                Starting Page Number
              </label>
              <input
                id="startNumberInput"
                type="number"
                min={1}
                max={9999}
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Font Size */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label htmlFor="numberFontSize" className="block text-xs font-semibold text-slate-700 mb-2">
                Font Size (pt)
              </label>
              <select
                id="numberFontSize"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10 pt (Compact)</option>
                <option value={11}>11 pt (Standard US Letter / A4)</option>
                <option value={12}>12 pt (Clear Legal)</option>
                <option value={14}>14 pt (Large Print)</option>
              </select>
            </div>
          </div>

          {/* Skip First Page */}
          <label className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={skipFirstPage}
              onChange={(e) => setSkipFirstPage(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-700">
              Skip cover page (leave Page 1 unnumbered and begin numbering on Page 2)
            </span>
          </label>

          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleApplyNumbers}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Hash className="w-4 h-4" />
              <span>{t('tool.pageNumbers.button')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
