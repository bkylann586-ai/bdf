import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Cpu, Timer } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

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
  const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

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
}

/**
 * Shared progress status component used across all tools (Merge, Split, Compress, etc.)
 */
export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  current,
  total,
  message,
  operationTitle,
  stageName,
  onCancel,
  cancelLabel = 'Cancel Batch',
}) => {
  const { t } = useTranslation();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live elapsed timer for real-time responsiveness feedback
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
  const displayTitle = operationTitle || t('progress.title');

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col items-center max-w-lg mx-auto text-center">
        {/* Animated Icon with subtle glow ring */}
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
            <Cpu className="w-3 h-3 text-white" />
          </span>
        </div>

        {/* Operation Title & Stage */}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
          {displayTitle}
        </h3>

        {/* Live status message with fixed min-height to prevent jitter */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {message || t('progress.processing')}
          </p>
        </div>

        {/* Enhanced Progress Bar Track */}
        <div className="w-full mb-3">
          <ProgressBar current={current} total={total} animated={true} />
        </div>

        {/* Metrics readout row: Steps, Percentage, Timer */}
        <div className="grid grid-cols-3 w-full text-xs text-slate-500 pt-2 pb-5 border-b border-slate-100">
          <div className="text-left font-mono tabular-nums">
            {total > 1 ? (
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

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-200 rounded-md transition-colors"
          >
            {cancelLabel}
          </button>
        )}

        {/* Privacy verification badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{t('progress.memoryNote')}</span>
        </div>
      </div>
    </div>
  );
};
