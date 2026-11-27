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
    <div className="w-full pq-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
              hasErrors
                ? 'bg-amber-50 border-amber-200 text-[#F59E0B]'
                : 'bg-emerald-50 border-emerald-200 text-[#10B981]'
            }`}
          >
            {hasErrors ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">{title}</h3>
            <p className="text-xs text-[#64748B] font-mono tabular-nums mt-0.5">
              {successItems.length} of {items.length} files succeeded
              {errorItems.length > 0 ? ` · ${errorItems.length} failed` : ''}
              {zipSummary ? ` · ZIP archive ${formatBytes(zipSummary.zipBlob.size)}` : ''}
            </p>
            {showSizeComparison && totalOrig > 0 && (
              <p className="text-xs text-[#0F172A] font-mono tabular-nums mt-1">
                Total: {formatBytes(totalOrig)} → {formatBytes(totalProc)}
                {isSmaller && (
                  <span className="text-[#059669] font-semibold ms-1.5">
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
              className="inline-flex items-center gap-2 px-5 min-h-[44px] text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#7C3AED] rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Download All as ZIP</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] text-sm font-medium text-[#0F172A] hover:text-[#2563EB] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#64748B]" />
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
      <div className="mt-5 divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden">
        {items.map((item) => {
          const res = item.result;
          const fileOrig = res?.originalSize ?? item.fileItem.size;
          const fileSmaller = showSizeComparison && res && fileOrig > 0 && res.fileSize < fileOrig;
          const filePct =
            fileSmaller && res ? Math.round(((fileOrig - res.fileSize) / fileOrig) * 100) : 0;

          return (
            <div
              key={item.fileItem.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    item.status === 'success'
                      ? 'bg-[#EFF6FF] border-[#DBEAFE] text-[#2563EB]'
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}
                >
                  {item.status === 'success' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate">
                    {res?.downloadName || item.fileItem.name}
                  </p>
                  {item.status === 'success' && res ? (
                    <p className="text-[11px] text-[#64748B] font-mono tabular-nums mt-0.5">
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
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[36px] text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
        <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B] text-center">
          <span>Need to do more? </span>
          <Link
            to={relatedToolPath}
            className="text-[#2563EB] hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Try {relatedToolName} next</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>
        </div>
      )}
    </div>
  );
};
