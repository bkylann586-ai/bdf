import React from 'react';
import {
  Archive,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  FileText,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { ProcessingResult } from '../types';
import { BatchItemOutcome, BatchPdfZipSummary } from '../lib/batchProcessing';
import { downloadBlob, formatBytes } from '../lib/fileHelpers';
import { Link } from './Link';
import { PerformanceMonitor } from './PerformanceMonitor';

interface BatchSuccessDownloadProps {
  title: string;
  items: BatchItemOutcome<ProcessingResult>[];
  zipSummary: BatchPdfZipSummary | null;
  onReset: () => void;
  showSizeComparison?: boolean;
  relatedToolPath?: string;
  relatedToolName?: string;
}

export const BatchSuccessDownload: React.FC<BatchSuccessDownloadProps> = ({
  title,
  items,
  zipSummary,
  onReset,
  showSizeComparison = false,
  relatedToolPath,
  relatedToolName,
}) => {
  const successItems = items.filter((item) => item.status === 'success' && item.result);
  const errorItems = items.filter((item) => item.status === 'error');
  const hasErrors = errorItems.length > 0;

  const totalOrig = zipSummary?.totalOriginalSize ?? 0;
  const totalProc = zipSummary?.totalProcessedSize ?? 0;
  const isSmaller = showSizeComparison && totalOrig > 0 && totalProc < totalOrig;
  const percentSaved = isSmaller
    ? Math.round(((totalOrig - totalProc) / totalOrig) * 100)
    : 0;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              hasErrors ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {hasErrors ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              {successItems.length} of {items.length} files succeeded
              {errorItems.length > 0 ? ` · ${errorItems.length} failed` : ''}
              {zipSummary ? ` · ZIP archive ${formatBytes(zipSummary.zipBlob.size)}` : ''}
            </p>
            {showSizeComparison && totalOrig > 0 && (
              <p className="text-xs text-slate-600 font-mono tabular-nums mt-1">
                Total: {formatBytes(totalOrig)} → {formatBytes(totalProc)}
                {isSmaller && (
                  <span className="text-emerald-700 font-semibold ml-1.5">
                    (-{percentSaved}% saved)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {zipSummary && successItems.length > 0 && (
            <button
              type="button"
              onClick={() => downloadBlob(zipSummary.zipBlob, zipSummary.zipFilename)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Archive className="w-4 h-4" />
              <span>Download All as ZIP</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Process More Files</span>
          </button>
        </div>
      </div>

      {/* Client-Side Performance Summary */}
      <PerformanceMonitor
        variant="summary"
        inputBytes={totalOrig > 0 ? totalOrig : items.reduce((s, it) => s + it.fileItem.size, 0)}
        outputBytes={totalProc > 0 ? totalProc : zipSummary?.zipBlob.size}
        className="mt-5"
      />

      {/* Per-file results breakdown */}
      <div className="mt-5 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
        {items.map((item) => {
          const res = item.result;
          const fileOrig = res?.originalSize ?? item.fileItem.size;
          const fileSmaller = showSizeComparison && res && fileOrig > 0 && res.fileSize < fileOrig;
          const filePct =
            fileSmaller && res ? Math.round(((fileOrig - res.fileSize) / fileOrig) * 100) : 0;

          return (
            <div
              key={item.fileItem.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    item.status === 'success'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {item.status === 'success' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {res?.downloadName || item.fileItem.name}
                  </p>
                  {item.status === 'success' && res ? (
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                      {res.pageCount ? `${res.pageCount} pages · ` : ''}
                      {showSizeComparison
                        ? `${formatBytes(fileOrig)} → ${formatBytes(res.fileSize)}${
                            fileSmaller ? ` (-${filePct}%)` : ''
                          }`
                        : formatBytes(res.fileSize)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-red-700 mt-0.5">
                      {item.error || 'Could not process this file.'}
                    </p>
                  )}
                </div>
              </div>

              {item.status === 'success' && res && (
                <button
                  type="button"
                  onClick={() => downloadBlob(res.blob, res.downloadName)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {relatedToolPath && relatedToolName && (
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
          <span>Need to do more? </span>
          <Link
            to={relatedToolPath}
            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Try {relatedToolName} next</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
};
