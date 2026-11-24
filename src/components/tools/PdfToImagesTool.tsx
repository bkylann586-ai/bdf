import React, { useState, useEffect, useRef } from 'react';
import { FileImage, Download, Archive, AlertCircle, FileText } from 'lucide-react';
import { ProcessingFile, ImageFormatOption, PdfToImagesOptions } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { convertPdfToImages, RenderedPageImage, PdfToImagesResult } from '../../lib/pdfToImages';
import { formatBytes, getPdfPageCount, downloadBlob } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const PdfToImagesTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [format, setFormat] = useState<ImageFormatOption>('image/png');
  const [scale, setScale] = useState<number>(1.5);
  const [pageSelection, setPageSelection] = useState<'all' | 'range'>('all');
  const [pageRange, setPageRange] = useState('1');

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [result, setResult] = useState<PdfToImagesResult | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusRef = useRef(status);
  const createdUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const revokeAllPreviewUrls = () => {
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current.clear();
  };

  useEffect(() => {
    return () => {
      revokeAllPreviewUrls();
    };
  }, []);

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

    revokeAllPreviewUrls();
    setPreviewUrls({});
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

    setPageRange(pageCount > 1 ? `1-${Math.min(3, pageCount)}` : '1');
  };

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.pdfToImages.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('pdf-to-images');
    try {
      const sample = await createSamplePdf('Presentation Slides', 3);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 10, message: t('progress.processing') });
    trackToolStart('pdf-to-images');
    const startTime = Date.now();

    try {
      const options: PdfToImagesOptions = {
        format,
        scale,
        quality: 0.9,
        pageSelection,
        pageRange,
      };

      const renderRes = await convertPdfToImages(file, options, (curr, tot, msg) => {
        setProgress({ current: curr, total: tot, message: msg });
      });

      revokeAllPreviewUrls();
      const nextPreviewUrls: Record<number, string> = {};
      for (const img of renderRes.images) {
        const objectUrl = URL.createObjectURL(img.blob);
        createdUrlsRef.current.add(objectUrl);
        nextPreviewUrls[img.pageNumber] = objectUrl;
      }

      setPreviewUrls(nextPreviewUrls);
      setResult(renderRes);
      setStatus('success');
      trackToolSuccess('pdf-to-images', {
        durationMs: Date.now() - startTime,
        pageCount: renderRes.totalRendered,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to render PDF pages into images.');
      trackToolError('pdf-to-images', err.name || 'RenderError');
    }
  };

  const handleDownloadSingle = (image: RenderedPageImage) => {
    downloadBlob(image.blob, image.filename);
  };

  const handleDownloadZip = () => {
    if (!result) return;
    downloadBlob(result.zipBlob, result.zipFilename);
  };

  const handleReset = () => {
    revokeAllPreviewUrls();
    setPreviewUrls({});
    setStatus('idle');
    setResult(null);
    setFile(null);
    setErrorMessage(null);
  };

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.pdfToImages.title')}
      />
    );
  }

  if (status === 'success' && result) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Rendered {result.totalRendered} {result.format.toUpperCase()} {result.totalRendered === 1 ? 'Image' : 'Images'}
            </h3>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              Archive size: {formatBytes(result.zipBlob.size)} · Ready for immediate download
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadZip}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Archive className="w-4 h-4" />
              <span>Download All as ZIP</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Convert another PDF
            </button>
          </div>
        </div>

        {/* Rendered Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {result.images.map((img) => (
            <div
              key={img.pageNumber}
              className="border border-slate-200 rounded-lg bg-slate-50 p-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="aspect-[3/4] bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center p-2 mb-3 shadow-inner">
                <img
                  src={previewUrls[img.pageNumber]}
                  alt={`Page ${img.pageNumber}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-slate-900">Page {img.pageNumber}</span>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {img.width} × {img.height}px ({formatBytes(img.size)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadSingle(img)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-300 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Page {img.pageNumber}</span>
                </button>
              </div>
            </div>
          ))}
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
            sampleLabel="Load a 3-page test PDF"
            helperText="Upload 1 PDF file (up to 250 MB). High-resolution canvas rendering extracts each page into crisp images."
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="formatSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Image Format
              </label>
              <select
                id="formatSelect"
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormatOption)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="image/png">PNG (Lossless, sharpest text)</option>
                <option value="image/jpeg">JPEG (Compact file size)</option>
              </select>
            </div>

            <div>
              <label htmlFor="resolutionSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution & Scale
              </label>
              <select
                id="resolutionSelect"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={1.5}>Standard Quality (1.5× scale / ~110 DPI)</option>
                <option value={2.0}>High Quality (2.0× scale / ~150 DPI)</option>
                <option value={3.0}>Ultra Crisp (3.0× scale / ~220 DPI)</option>
              </select>
            </div>

            <div>
              <label htmlFor="pageSelectionSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Pages to Render
              </label>
              <select
                id="pageSelectionSelect"
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
              <label htmlFor="targetRangeInput" className="block text-xs font-semibold text-slate-700 mb-1">
                Specify Pages (e.g. 1-2, 3)
              </label>
              <input
                id="targetRangeInput"
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="e.g. 1-3"
              />
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleConvert}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <FileImage className="w-4 h-4" />
              <span>Convert PDF to Images Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
