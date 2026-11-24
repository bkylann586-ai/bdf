import React, { useState, useEffect, useRef } from 'react';
import { FileText, Stamp, AlertCircle, Layers } from 'lucide-react';
import {
  ProcessingFile,
  ProcessingResult,
  WatermarkColor,
  WatermarkPosition,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { addWatermarkToPdf } from '../../lib/watermarkPdf';
import { formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const WatermarkPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<WatermarkPosition>('diagonal');
  const [color, setColor] = useState<WatermarkColor>('slate');
  const [opacity, setOpacity] = useState(0.28);
  const [fontSize, setFontSize] = useState(48);
  const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('1');
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
    setPageRange(pageCount > 1 ? `1-${pageCount}` : '1');
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.watermark.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('watermark-pdf');
    try {
      const sample = await createSamplePdf('Client Proposal Contract', 4);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 3, message: t('progress.processing') });
    trackToolStart('watermark-pdf');
    const startTime = Date.now();

    try {
      const res = await addWatermarkToPdf(
        file,
        {
          text,
          opacity,
          fontSize,
          position,
          color,
          pageSelection,
          pageRange,
        },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(res);
      setStatus('success');
      trackToolSuccess('watermark-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: res.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to watermark PDF.');
      trackToolError('watermark-pdf', err.name || 'WatermarkError');
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
        title={t('tool.watermark.successTitle')}
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
      />
    );
  }

  const presets = ['CONFIDENTIAL', 'DRAFT', 'COPY', 'DO NOT DISTRIBUTE'];

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
            sampleLabel="Load a 4-page sample PDF to stamp"
            helperText="Select 1 PDF file (up to 250 MB) to add custom diagonal, centered, or tiled text stamps."
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

          {/* Watermark Text + Quick Presets */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
            <label htmlFor="watermarkTextInput" className="block text-xs font-semibold text-slate-700">
              Watermark Text (max 80 characters)
            </label>
            <input
              id="watermarkTextInput"
              type="text"
              maxLength={80}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
              placeholder="e.g. CONFIDENTIAL"
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500">Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setText(preset)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    text === preset
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Layout / Color / Size / Opacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label htmlFor="watermarkPosition" className="block text-xs font-semibold text-slate-700 mb-2">
                Layout Style
              </label>
              <select
                id="watermarkPosition"
                value={position}
                onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="diagonal">Diagonal (45° across center)</option>
                <option value="center">Centered Horizontal</option>
                <option value="tiled">Tiled 2×3 Grid</option>
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label htmlFor="watermarkColor" className="block text-xs font-semibold text-slate-700 mb-2">
                Ink Color
              </label>
              <select
                id="watermarkColor"
                value={color}
                onChange={(e) => setColor(e.target.value as WatermarkColor)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="slate">Neutral Slate Gray</option>
                <option value="red">Alert Crimson Red</option>
                <option value="blue">Classic Navy Blue</option>
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="watermarkOpacity" className="text-xs font-semibold text-slate-700">
                  Transparency (Opacity)
                </label>
                <span className="text-xs font-mono text-slate-600">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                id="watermarkOpacity"
                type="range"
                min={0.15}
                max={0.65}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity( parseFloat(e.target.value) )}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="watermarkSize" className="text-xs font-semibold text-slate-700">
                  Base Font Size
                </label>
                <span className="text-xs font-mono text-slate-600">{fontSize} pt</span>
              </div>
              <input
                id="watermarkSize"
                type="range"
                min={28}
                max={64}
                step={4}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Target Pages */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Apply Stamp To:</span>
              <button
                type="button"
                onClick={() => setPageSelection('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  pageSelection === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All {file.pageCount} Pages</span>
              </button>
              <button
                type="button"
                onClick={() => setPageSelection('range')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  pageSelection === 'range'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Specific Page Range</span>
              </button>
            </div>

            {pageSelection === 'range' && (
              <div>
                <label htmlFor="watermarkPageRange" className="block text-xs font-medium text-slate-700 mb-1">
                  Enter pages to stamp (1–{file.pageCount})
                </label>
                <input
                  id="watermarkPageRange"
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 1-3"
                />
              </div>
            )}
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
              onClick={handleApplyWatermark}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Stamp className="w-4 h-4" />
              <span>{t('tool.watermark.button')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
