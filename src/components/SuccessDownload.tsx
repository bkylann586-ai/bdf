import React from 'react';
import { Download, CheckCircle2, RotateCcw, FileText, ArrowRight, Info } from 'lucide-react';
import { ProcessingResult } from '../types';
import { formatBytes, downloadBlob } from '../lib/pdfUtils';
import { Link } from './Link';
import { useTranslation } from '../lib/i18n';

interface SuccessDownloadProps {
  result: ProcessingResult;
  onReset: () => void;
  title?: string;
  relatedToolPath?: string;
  relatedToolName?: string;
}

export const SuccessDownload: React.FC<SuccessDownloadProps> = ({
  result,
  onReset,
  title,
  relatedToolPath,
  relatedToolName,
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

  const isZip = result.downloadName.endsWith('.zip');

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="max-w-xl mx-auto text-center flex flex-col items-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            isLarger
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {isLarger ? (
            <Info className="w-8 h-8 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{displayTitle}</h3>
        {result.message && (
          <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-md">
            {result.message}
          </p>
        )}

        {/* File Information Card */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {result.downloadName}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                <span>{t('success.processedSize')} {formatBytes(result.fileSize)}</span>
                {result.pageCount && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{result.pageCount} {t('success.pages')}</span>
                  </>
                )}
                {result.itemCount && !result.pageCount && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{result.itemCount} {t('success.items')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transparent size comparisons */}
          {hasOriginal && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs">
              <div className="flex items-center justify-between font-mono tabular-nums mb-1">
                <span className="text-slate-500">{t('success.originalSize')}</span>
                <span className="text-slate-700 font-medium">{formatBytes(result.originalSize!)}</span>
              </div>
              <div className="flex items-center justify-between font-mono tabular-nums">
                <span className="text-slate-500">{t('success.processedSize')}</span>
                <span className="text-slate-900 font-medium">{formatBytes(result.fileSize)}</span>
              </div>

              {isSmaller && (
                <div className="mt-2 pt-2 border-t border-slate-200/40 flex items-center justify-between font-medium">
                  <span className="text-emerald-700">{t('success.sizeReduction')}</span>
                  <span className="text-emerald-700 font-mono tabular-nums">
                    -{percentSaved}% ({formatBytes(result.originalSize! - result.fileSize)} saved)
                  </span>
                </div>
              )}

              {isLarger && (
                <div className="mt-2 pt-2 border-t border-slate-200/40 text-amber-800 bg-amber-50/60 p-2.5 rounded">
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span>{t('success.sizeDifference')}</span>
                    <span className="font-mono tabular-nums">+{percentIncreased}% (+{formatBytes(result.fileSize - result.originalSize!)} larger)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/80">
                    The original document was already compactly compressed or structured. Processing did not yield a smaller file. Your original file is recommended.
                  </p>
                </div>
              )}

              {isIdentical && (
                <div className="mt-2 pt-2 border-t border-slate-200/40 flex items-center justify-between font-medium text-slate-600">
                  <span>{t('success.sizeDifference')}</span>
                  <span>Identical size (0% change)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isZip ? t('success.downloadZip') : t('success.downloadPdf')}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>{t('success.processAnother')}</span>
          </button>
        </div>

        {relatedToolPath && relatedToolName && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>{t('success.needMore')} </span>
            <Link
              to={relatedToolPath}
              className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>{t('success.tryNext', { tool: relatedToolName })}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
