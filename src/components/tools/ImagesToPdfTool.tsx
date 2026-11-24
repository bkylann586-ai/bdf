import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, ArrowLeft, ArrowRight, Trash2, Plus, AlertCircle } from 'lucide-react';
import {
  ProcessingFile,
  ProcessingResult,
  PageSizeOption,
  PageOrientationOption,
  MarginOption,
} from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { convertImagesToPdf } from '../../lib/imagesToPdf';
import { formatBytes } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSampleImage } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const ImagesToPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [images, setImages] = useState<ProcessingFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<PageOrientationOption>('auto');
  const [margin, setMargin] = useState<MarginOption>('small');
  const [outputName, setOutputName] = useState('pdfquick-converted.pdf');

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const imagesRef = useRef<ProcessingFile[]>([]);
  const createdUrlsRef = useRef<Set<string>>(new Set());
  const statusRef = useRef(status);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const revokeTrackedUrl = (url?: string) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    createdUrlsRef.current.delete(url);
  };

  // Clean up all tracked thumbnail object URLs when component unmounts
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrlsRef.current.clear();
    };
  }, []);

  const handleFilesSelected = (newFiles: File[]) => {
    if (statusRef.current === 'processing' || statusRef.current === 'success') return;
    setErrorMessage(null);
    const currentTotalBytes = imagesRef.current.reduce((acc, img) => acc + img.size, 0);
    const validation = validateSelectedFiles(newFiles, {
      accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
      multiple: true,
      existingTotalBytes: currentTotalBytes,
    });

    if (validation.errorMessage) {
      setErrorMessage(validation.errorMessage);
    }

    if (validation.validFiles.length === 0) return;

    if (statusRef.current === 'error') {
      setStatus('idle');
    }

    const mapped: ProcessingFile[] = validation.validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      createdUrlsRef.current.add(previewUrl);
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      };
    });

    setImages((prev) => {
      const updated = [...prev, ...mapped];
      imagesRef.current = updated;
      return updated;
    });
  };

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFilesSelected(dropped);
      },
      t('tool.imagesToPdf.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSamples = async () => {
    setErrorMessage(null);
    trackSampleUse('images-to-pdf');
    try {
      const sample1 = await createSampleImage('Architecture Diagram', 800, 600, 'image/jpeg');
      const sample2 = await createSampleImage('Mobile UI Screenshot', 600, 800, 'image/png');
      handleFilesSelected([sample1, sample2]);
    } catch (err: any) {
      setErrorMessage(`Failed to create sample images: ${err.message}`);
    }
  };

  const moveImage = (index: number, direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[target];
      copy[target] = item;
      return copy;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      revokeTrackedUrl(item?.previewUrl);
      const updated = prev.filter((i) => i.id !== id);
      imagesRef.current = updated;
      return updated;
    });
  };

  const clearAll = () => {
    imagesRef.current.forEach((img) => revokeTrackedUrl(img.previewUrl));
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current.clear();
    imagesRef.current = [];
    setImages([]);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setErrorMessage('Please add at least 1 image.');
      return;
    }

    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: images.length, message: t('progress.processing') });
    trackToolStart('images-to-pdf');
    const startTime = Date.now();

    try {
      const convertRes = await convertImagesToPdf(
        images,
        {
          pageSize,
          orientation,
          margin,
        },
        outputName,
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(convertRes);
      setStatus('success');
      trackToolSuccess('images-to-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: images.length,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to convert images to PDF.');
      trackToolError('images-to-pdf', err.name || 'ConvertError');
    }
  };

  const handleReset = () => {
    clearAll();
    setStatus('idle');
    setResult(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={t('tool.imagesToPdf.successTitle')}
        relatedToolPath="/pdf-to-images"
        relatedToolName="PDF to Images"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.imagesToPdf.title')}
      />
    );
  }

  const totalBytes = images.reduce((acc, img) => acc + img.size, 0);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      {images.length === 0 ? (
        <div className="space-y-3">
          <DropZone
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple={true}
            existingTotalBytes={totalBytes}
            delegateValidation={true}
            onFilesSelected={handleFilesSelected}
            onSampleRequested={handleLoadSamples}
            sampleLabel="Load 2 sample test images"
            helperText="Upload JPG, PNG, or WebP pictures (up to 250 MB total). Use the arrow buttons to arrange pages, choose page sizes, and convert."
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Selected Images ({images.length})
              </h3>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                Total size: {formatBytes(totalBytes)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add more images</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  multiple
                  aria-label="Add more images"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                />
              </label>

              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Image Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative group bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={img.previewUrl}
                    alt={img.name}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                    Page {idx + 1}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-700 truncate max-w-[90px]" title={img.name}>
                    {img.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'prev')}
                      disabled={idx === 0}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20"
                      title="Move left"
                      aria-label="Move image earlier"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'next')}
                      disabled={idx === images.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20"
                      title="Move right"
                      aria-label="Move image later"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div>
              <label htmlFor="pageSizeSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Page Size
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="a4">A4 (Standard 210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
                <option value="fit">Fit to Image (Native Dimensions)</option>
              </select>
            </div>

            <div>
              <label htmlFor="orientationSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Page Orientation
              </label>
              <select
                id="orientationSelect"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as PageOrientationOption)}
                disabled={pageSize === 'fit'}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="auto">Auto (Match Image Orientation)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label htmlFor="marginSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Page Margins
              </label>
              <select
                id="marginSelect"
                value={margin}
                onChange={(e) => setMargin(e.target.value as MarginOption)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">No Margin (Full Bleed)</option>
                <option value="small">Small Margin (0.25 inch)</option>
                <option value="large">Large Margin (0.50 inch)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <div className="max-w-md">
              <label htmlFor="imageOutputName" className="block text-xs font-semibold text-slate-700 mb-1">
                Output File Name
              </label>
              <input
                id="imageOutputName"
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
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
              {images.length} {images.length === 1 ? 'image' : 'images'} will become a {images.length}-page PDF.
            </span>

            <button
              type="button"
              onClick={handleConvert}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Convert Images to PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
