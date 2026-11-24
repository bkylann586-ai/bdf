import React, { useState, useEffect, useRef } from 'react';
import { FileText, Minimize2, AlertCircle, Info } from 'lucide-react';
import { ProcessingFile, ProcessingResult, CompressLevel } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { compressPdfFile } from '../../lib/compressPdf';
import { formatBytes, getPdfPageCount } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSamplePdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const CompressPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();
  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [level, setLevel] = useState<CompressLevel>('recommended');
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

  // Register with window-wide drag & drop system (disabled during processing/success)
  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.compress.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('compress-pdf');
    try {
      const sample = await createSamplePdf('Scanned Receipt & Report', 3);
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err.message}`);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 10, message: t('progress.processing') });
    trackToolStart('compress-pdf');
    const startTime = Date.now();

    try {
      const compressRes = await compressPdfFile(
        file,
        { level },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );
      setResult(compressRes);
      setStatus('success');
      trackToolSuccess('compress-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: file.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to compress document.');
      trackToolError('compress-pdf', err.name || 'CompressError');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setFile(null);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    const isSmaller = typeof result.originalSize === 'number' && result.fileSize < result.originalSize;
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={isSmaller ? t('tool.compress.successTitle') : t('tool.compress.reportTitle')}
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
        operationTitle={t('tool.compress.title')}
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
            sampleLabel="Load a 3-page test PDF"
            helperText="Select 1 PDF file (up to 250 MB) to optimize. All processing runs privately inside your browser."
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
                  Current size: {formatBytes(file.size)} · {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
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

          {/* Honest Notice */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-900">How browser compression works: </strong>
              Scanned documents and PDFs containing high-resolution images benefit the most from optimization. Plain vector and text-only documents are often already compact; lossless re-encoding removes orphaned data and stream redundancies.
            </div>
          </div>

          {/* Optimization Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Compression Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setLevel('recommended')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  level === 'recommended'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Balanced (Recommended)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Best balance of visual clarity and file size reduction. Ideal for standard business documents and scans.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('extreme')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  level === 'extreme'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Maximum Reduction</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Aggressive downsampling for small email attachments and fast mobile web sharing.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('lossless')}
                className={`p-3.5 text-left border rounded-lg transition-all ${
                  level === 'lossless'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Lossless Re-encode</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Preserves original vector clarity 100%. Re-encodes object streams and strips obsolete catalog objects.
                </p>
              </button>
            </div>
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
              onClick={handleCompress}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Compress PDF Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
