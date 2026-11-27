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
        <div className="flex justify-between items-center text-xs mb-1.5 text-[#17243A] font-medium">
          <span>{label}</span>
          <span className="font-mono tabular-nums text-[#2563EB] font-bold">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-[#F4F7FB] rounded-full h-3 overflow-hidden p-0.5 border border-[#E2E8F0]">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-[#102A56] via-[#2563EB] to-[#38BDF8] ${
            animated
              ? 'relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] before:animate-[shimmer_1.8s_infinite]'
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
  currentFileIndex?: number;
  totalFiles?: number;
  itemLabel?: string;
}

/**
 * Shared progress status component used across all tools.
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

  useEffect(() => {
    startRun({
      operationName: operationTitle || stageName,
      inputBytes: batchTotalBytes && batchTotalBytes > 0 ? batchTotalBytes : undefined,
    });
    return () => {
      finishRun();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const isBatchMode =
    (batchItems && batchItems.length > 1) || (totalFiles !== undefined && totalFiles > 1);
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
    <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
      <div className="flex flex-col items-center max-w-xl mx-auto text-center">
        {/* Crisp Execution Icon */}
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F7FB] text-[#2563EB] flex items-center justify-center border border-[#E2E8F0]">
            <Loader2 className="w-7 h-7 animate-spin text-[#2563EB]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#102A56] border-2 border-white flex items-center justify-center">
            {isBatchMode ? (
              <Layers className="w-2.5 h-2.5 text-[#38BDF8]" />
            ) : (
              <Cpu className="w-2.5 h-2.5 text-[#38BDF8]" />
            )}
          </span>
        </div>

        {/* Operation Title & Batch Counter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-[#102A56] tracking-tight">{displayTitle}</h3>
          {isBatchMode && resolvedTotalFiles > 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F4F7FB] text-[#2563EB] border border-[#E2E8F0] font-mono tabular-nums">
              {completedCount}/{resolvedTotalFiles} done
            </span>
          )}
        </div>

        {/* Live status message */}
        <p className="text-xs sm:text-sm text-[#64748B] font-medium mb-5 min-h-[20px]">
          {message || t('progress.processing')}
        </p>

        {/* Overall Progress Bar Track */}
        <div className="w-full mb-3">
          <ProgressBar current={current} total={total} animated={true} />
        </div>

        {/* Metrics readout row: File Count / Steps, Percentage, Timer */}
        <div className="grid grid-cols-3 w-full text-xs text-[#64748B] pt-2 pb-4 border-b border-[#E2E8F0]">
          <div className="text-start font-mono tabular-nums">
            {isBatchMode && resolvedTotalFiles > 1 && activeItemIndex ? (
              <span>
                <span className="text-[#64748B] font-sans">{itemLabel} </span>
                <strong className="text-[#17243A]">{activeItemIndex}</strong>
                <span className="text-[#64748B] font-sans"> {t('progress.of')} </span>
                <strong className="text-[#17243A]">{resolvedTotalFiles}</strong>
              </span>
            ) : total > 1 ? (
              <span>
                <span className="text-[#64748B] font-sans">{t('progress.step')} </span>
                <strong className="text-[#17243A]">{current}</strong>
                <span className="text-[#64748B] font-sans"> {t('progress.of')} </span>
                <strong className="text-[#17243A]">{total}</strong>
              </span>
            ) : (
              <span className="text-[#17243A] font-sans font-medium">
                {stageName || t('progress.local')}
              </span>
            )}
          </div>

          <div className="text-center font-bold text-[#2563EB] font-mono text-sm tabular-nums">
            {percentage}%
          </div>

          <div className="text-end font-mono tabular-nums text-[#64748B] flex items-center justify-end gap-1">
            <Timer className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{elapsedSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Live Per-File Batch Queue Status List */}
        {batchItems && batchItems.length > 1 && (
          <div
            aria-label="Batch file progress list"
            className="w-full mt-4 text-start border border-[#E2E8F0] rounded-xl bg-[#F4F7FB]/60 divide-y divide-[#E2E8F0] max-h-56 overflow-y-auto"
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
                      ? 'bg-[#EFF6FF]'
                      : isCompleted
                        ? 'bg-white'
                        : isError
                          ? 'bg-red-50/70'
                          : 'bg-[#F4F7FB]/50 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-[11px] font-mono tabular-nums text-[#64748B] w-5 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isActive && (
                        <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin shrink-0" />
                      )}
                      {isError && (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      {item.status === 'pending' && (
                        <Clock className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#17243A] truncate">
                          {item.name}
                        </p>
                        {(item.detail || typeof item.size === 'number') && (
                          <p className="text-[11px] text-[#64748B] font-mono tabular-nums truncate">
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
                            ? 'text-[#2563EB]'
                            : isError
                              ? 'text-red-700'
                              : 'text-[#64748B]'
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
                    <div className="mt-1.5 ps-7 pe-1">
                      <div className="w-full h-1.5 bg-[#DBEAFE] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB] rounded-full transition-all duration-200"
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
            className="mt-4 px-4 min-h-[40px] text-xs font-semibold text-[#17243A] hover:text-red-700 bg-white hover:bg-red-50 border border-[#E2E8F0] hover:border-red-200 rounded-xl transition-colors cursor-pointer"
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

        {/* Privacy verification note */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span>{t('progress.memoryNote')}</span>
        </div>
      </div>
    </div>
  );
};
