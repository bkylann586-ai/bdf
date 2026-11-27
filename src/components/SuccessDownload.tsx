import React, { Suspense, lazy } from 'react';
import { Download, CheckCircle2, RotateCcw, FileText, ArrowRight, Info } from 'lucide-react';
import { ProcessingResult } from '../types';
import { formatBytes, downloadBlob } from '../lib/fileHelpers';
import { Link } from './Link';
import { useTranslation } from '../lib/i18n';
import { PerformanceMonitor } from './PerformanceMonitor';

const LazyPdfPreview = lazy(() =>
  import('./PdfPreview').then((m) => ({ default: m.PdfPreview }))
);

interface SuccessDownloadProps {
  result: ProcessingResult;
  onReset: () => void;
  title?: string;
  relatedToolPath?: string;
  relatedToolName?: string;
  originalFile?: File | Blob | null;
  previewDefaultOpen?: boolean;
}

export const SuccessDownload: React.FC<SuccessDownloadProps> = ({
  result,
  onReset,
  title,
  relatedToolPath,
  relatedToolName,
  originalFile,
  previewDefaultOpen = true,
}) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    downloadBlob(result.blob, result.downloadName);
  };

  const defaultTitle = t('success.ready');
  const displayTitle = title || defaultTitle;

  const hasOriginal = typeof result.originalSize === 'number' && result.originalSize > 0;
  const isSmaller = hasOriginal && result.fileSize < result.originalSize!;
  const isLarger = hasOriginal && result.fileSize > result.originalSize!;
  const isIdentical = hasOriginal && result.fileSize === result.originalSize!;

  const percentSaved = isSmaller
    ? Math.round(((result.originalSize! - result.fileSize) / result.originalSize!) * 100)
    : 0;

  const percentIncreased = isLarger
    ? Math.round(((result.fileSize - result.originalSize!) / result.originalSize!) * 100)
    : 0;

  const isZip = result.downloadName.toLowerCase().endsWith('.zip');
  const isPdfResult =
    !isZip &&
    (result.downloadName.toLowerCase().endsWith('.pdf') ||
      result.blob.type === 'application/pdf');

  return (
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
      <div className="max-w-xl mx-auto text-center flex flex-col items-center">
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${
            isLarger
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}
        >
          {isLarger ? (
            <Info className="w-7 h-7 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          )}
        </div>

        <h3 className="text-xl font-bold text-[#102A56] mb-2">{displayTitle}</h3>
        {result.message && (
          <p className="text-xs sm:text-sm text-[#64748B] mb-6 max-w-md leading-relaxed">
            {result.message}
          </p>
        )}

        {/* File Information Card */}
        <div className="w-full bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4 mb-6 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#102A56] text-[#38BDF8] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#17243A] truncate">
                {result.downloadName}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] font-mono tabular-nums mt-0.5">
                <span>
                  {t('success.processedSize')} {formatBytes(result.fileSize)}
                </span>
                {result.pageCount && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {result.pageCount} {t('success.pages')}
                    </span>
                  </>
                )}
                {result.itemCount && !result.pageCount && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {result.itemCount} {t('success.items')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transparent size comparisons */}
          {hasOriginal && (
            <div className="mt-3 pt-3 border-t border-[#E2E8F0] text-xs">
              <div className="flex items-center justify-between font-mono tabular-nums mb-1">
                <span className="text-[#64748B]">{t('success.originalSize')}</span>
                <span className="text-[#17243A] font-medium">
                  {formatBytes(result.originalSize!)}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono tabular-nums">
                <span className="text-[#64748B]">{t('success.processedSize')}</span>
                <span className="text-[#102A56] font-bold">{formatBytes(result.fileSize)}</span>
              </div>

              {isSmaller && (
                <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between font-semibold">
                  <span className="text-emerald-700">{t('success.sizeReduction')}</span>
                  <span className="text-emerald-700 font-mono tabular-nums">
                    -{percentSaved}% ({formatBytes(result.originalSize! - result.fileSize)} saved)
                  </span>
                </div>
              )}

              {isLarger && (
                <div className="mt-2.5 text-amber-800 bg-amber-50 border border-amber-200/80 p-3 rounded-lg">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span>{t('success.sizeDifference')}</span>
                    <span className="font-mono tabular-nums">
                      +{percentIncreased}% (+{formatBytes(result.fileSize - result.originalSize!)} larger)
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/85">
                    The original document was already compactly compressed or structured. Processing did not yield a smaller file. Your original file is recommended.
                  </p>
                </div>
              )}

              {isIdentical && (
                <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between font-medium text-[#64748B]">
                  <span>{t('success.sizeDifference')}</span>
                  <span>Identical size (0% change)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Client-Side Performance Summary */}
        <PerformanceMonitor
          variant="summary"
          inputBytes={result.originalSize}
          outputBytes={result.fileSize}
          className="mb-6"
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 min-h-[44px] text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isZip ? t('success.downloadZip') : t('success.downloadPdf')}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 min-h-[44px] text-sm font-medium text-[#17243A] hover:text-[#102A56] bg-white hover:bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#64748B]" />
            <span>{t('success.processAnother')}</span>
          </button>
        </div>

        {relatedToolPath && relatedToolName && (
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            <span>{t('success.needMore')} </span>
            <Link
              to={relatedToolPath}
              className="text-[#2563EB] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>{t('success.tryNext', { tool: relatedToolName })}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {isPdfResult && (
        <div className="max-w-3xl mx-auto mt-6">
          <Suspense
            fallback={
              <div className="border border-[#E2E8F0] rounded-xl p-6 text-center text-xs text-[#64748B] bg-[#F4F7FB]">
                Loading PDF preview...
              </div>
            }
          >
            <LazyPdfPreview
              file={result.blob}
              compareFile={originalFile ?? undefined}
              title="Processed PDF Preview"
              beforeLabel="Original (Before)"
              afterLabel="Result (After)"
              defaultViewMode="single"
              collapsible={true}
              defaultOpen={previewDefaultOpen}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};
