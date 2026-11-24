import React, { useState, useEffect } from 'react';
import {
  Loader2,
  ShieldCheck,
  Cpu,
  Timer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { formatBytes } from '../lib/fileHelpers';
import { usePerformanceMonitor } from '../lib/performanceMonitor';
import { PerformanceMonitor } from './PerformanceMonitor';
import type { BatchProgressItem } from '../types';

export type { BatchProgressItem };

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
  animated?: boolean;
}

/**
 * Reusable stand-alone progress bar track with smooth animation and label
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  className = '',
  animated = true,
}) => {
  const percentage =
    total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs mb-1.5 text-slate-600 font-medium">
          <span>{label}</span>
          <span className="font-mono tabular-nums text-blue-600 font-semibold">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner p-0.5 border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-blue-600 to-indigo-600 ${
            animated
              ? 'relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)] before:animate-[shimmer_1.8s_infinite]'
              : ''
          }`}
          style={{ width: `${Math.max(4, percentage)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export interface ProcessingProgressProps {
  current: number;
  total: number;
  message: string;
  operationTitle?: string;
  stageName?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  batchItems?: BatchProgressItem[];
  currentFileIndex?: number; // 1-based active item index
  totalFiles?: number;
  itemLabel?: string;
}

/**
 * Shared progress status component used across all tools (Merge, Images to PDF, Compress, etc.)
 * Displays a rich batch queue & progress bar automatically when multiple files are processed.
 */
export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  current,
  total,
  message,
  operationTitle,
  stageName,
  onCancel,
  cancelLabel,
  batchItems,
  currentFileIndex,
  totalFiles,
  itemLabel = 'File',
}) => {
  const { t } = useTranslation();
  const { startRun, finishRun } = usePerformanceMonitor();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const batchTotalBytes = batchItems?.reduce(
    (sum, item) => sum + (typeof item.size === 'number' ? item.size : 0),
    0
  );

  // Start performance telemetry when active processing starts; finish on unmount
  useEffect(() => {
    startRun({
      operationName: operationTitle || stageName,
      inputBytes: batchTotalBytes && batchTotalBytes > 0 ? batchTotalBytes : undefined,
    });
    return () => {
      finishRun();
    };
    // Only tie telemetry lifecycle to ProcessingProgress mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live elapsed timer for real-time responsiveness feedback
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const percentage =
    total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
  const displayTitle = operationTitle || t('progress.title');
  const isBatchMode = (batchItems && batchItems.length > 1) || (totalFiles !== undefined && totalFiles > 1);
  const resolvedTotalFiles = totalFiles ?? batchItems?.length ?? 0;
  const completedCount =
    batchItems?.filter((item) => item.status === 'completed' || item.status === 'error').length ?? 0;
  const activeItemIndex =
    currentFileIndex ??
    (batchItems
      ? Math.max(
          1,
          batchItems.findIndex((item) => item.status === 'processing') + 1 ||
            Math.min(resolvedTotalFiles, completedCount + 1)
        )
      : undefined);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col items-center max-w-xl mx-auto text-center">
        {/* Animated Icon with subtle glow ring */}
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
            {isBatchMode ? (
              <Layers className="w-3 h-3 text-white" />
            ) : (
              <Cpu className="w-3 h-3 text-white" />
            )}
          </span>
        </div>

        {/* Operation Title & Batch Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{displayTitle}</h3>
          {isBatchMode && resolvedTotalFiles > 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono tabular-nums">
              {completedCount}/{resolvedTotalFiles} done
            </span>
          )}
        </div>

        {/* Live status message */}
        <div className="flex items-center justify-center gap-2 mb-5 min-h-[20px]">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {message || t('progress.processing')}
          </p>
        </div>

        {/* Overall Progress Bar Track */}
        <div className="w-full mb-3">
          <ProgressBar current={current} total={total} animated={true} />
        </div>

        {/* Metrics readout row: File Count / Steps, Percentage, Timer */}
        <div className="grid grid-cols-3 w-full text-xs text-slate-500 pt-2 pb-4 border-b border-slate-100">
          <div className="text-left font-mono tabular-nums">
            {isBatchMode && resolvedTotalFiles > 1 && activeItemIndex ? (
              <span>
                <span className="text-slate-400 font-sans">{itemLabel} </span>
                <strong className="text-slate-800">{activeItemIndex}</strong>
                <span className="text-slate-400 font-sans"> {t('progress.of')} </span>
                <strong className="text-slate-800">{resolvedTotalFiles}</strong>
              </span>
            ) : total > 1 ? (
              <span>
                <span className="text-slate-400 font-sans">{t('progress.step')} </span>
                <strong className="text-slate-800">{current}</strong>
                <span className="text-slate-400 font-sans"> {t('progress.of')} </span>
                <strong className="text-slate-800">{total}</strong>
              </span>
            ) : (
              <span className="text-slate-600 font-sans">{stageName || t('progress.local')}</span>
            )}
          </div>

          <div className="text-center font-bold text-blue-600 font-mono text-sm tabular-nums">
            {percentage}%
          </div>

          <div className="text-right font-mono tabular-nums text-slate-500 flex items-center justify-end gap-1">
            <Timer className="w-3.5 h-3.5 text-slate-400" />
            <span>{elapsedSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Live Per-File Batch Queue Status List */}
        {batchItems && batchItems.length > 1 && (
          <div
            aria-label="Batch file progress list"
            className="w-full mt-4 text-left border border-slate-200 rounded-lg bg-slate-50/70 divide-y divide-slate-200/80 max-h-56 overflow-y-auto"
          >
            {batchItems.map((item, idx) => {
              const isActive = item.status === 'processing';
              const isCompleted = item.status === 'completed';
              const isError = item.status === 'error';
              const itemPct =
                typeof item.progress === 'number'
                  ? Math.min(100, Math.max(0, Math.round(item.progress)))
                  : isCompleted
                    ? 100
                    : isActive
                      ? 45
                      : 0;

              return (
                <div
                  key={item.id}
                  className={`px-3.5 py-2.5 transition-colors ${
                    isActive
                      ? 'bg-blue-50/70'
                      : isCompleted
                        ? 'bg-white'
                        : isError
                          ? 'bg-red-50/60'
                          : 'bg-slate-50/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 w-5 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isActive && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                      )}
                      {isError && (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      {item.status === 'pending' && (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {item.name}
                        </p>
                        {(item.detail || typeof item.size === 'number') && (
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                            {typeof item.size === 'number' ? formatBytes(item.size) : ''}
                            {typeof item.size === 'number' && item.detail ? ' · ' : ''}
                            {item.detail || ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold font-mono tabular-nums shrink-0 ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isActive
                            ? 'text-blue-700'
                            : isError
                              ? 'text-red-700'
                              : 'text-slate-400'
                      }`}
                    >
                      {isCompleted
                        ? 'Done'
                        : isError
                          ? 'Error'
                          : isActive
                            ? `${itemPct}%`
                            : 'Queued'}
                    </span>
                  </div>

                  {isActive && (
                    <div className="mt-1.5 pl-7 pr-1">
                      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-200"
                          style={{ width: `${Math.max(8, itemPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-200 rounded-md transition-colors cursor-pointer"
          >
            {cancelLabel || t('progress.cancel')}
          </button>
        )}

        {/* Live Client-Side Performance Telemetry */}
        <PerformanceMonitor
          variant="live"
          inputBytes={batchTotalBytes && batchTotalBytes > 0 ? batchTotalBytes : undefined}
          className="mt-4"
        />

        {/* Privacy verification badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{t('progress.memoryNote')}</span>
        </div>
      </div>
    </div>
  );
};
