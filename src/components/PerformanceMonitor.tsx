import React from 'react';
import { Activity, Cpu, Timer } from 'lucide-react';
import {
  formatDurationMs,
  formatSignedMemoryDelta,
  usePerformanceMonitor,
} from '../lib/performanceMonitor';
import { formatBytes } from '../lib/fileHelpers';
import { useTranslation } from '../lib/i18n';

export interface PerformanceMonitorProps {
  variant?: 'live' | 'summary';
  durationMs?: number;
  inputBytes?: number;
  outputBytes?: number;
  className?: string;
}

/**
 * Transparent client-side telemetry panel showing real execution duration
 * and JS heap memory usage (with honest payload footprint fallback when
 * browser JS heap APIs are unavailable outside Chromium).
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  variant = 'summary',
  durationMs: durationOverride,
  inputBytes: inputBytesOverride,
  outputBytes: outputBytesOverride,
  className = '',
}) => {
  const { t } = useTranslation();
  const { metrics } = usePerformanceMonitor();

  const resolvedDurationMs =
    typeof durationOverride === 'number' ? durationOverride : metrics.durationMs;
  const resolvedInputBytes =
    typeof inputBytesOverride === 'number' ? inputBytesOverride : metrics.inputBytes;
  const resolvedOutputBytes =
    typeof outputBytesOverride === 'number' ? outputBytesOverride : metrics.outputBytes;

  const totalBufferBytes =
    (typeof resolvedInputBytes === 'number' ? resolvedInputBytes : 0) +
    (typeof resolvedOutputBytes === 'number' ? resolvedOutputBytes : 0);

  const isLive = variant === 'live';
  const memoryBytesToShow = isLive
    ? metrics.currentUsedHeapBytes
    : metrics.peakUsedHeapBytes ?? metrics.currentUsedHeapBytes;

  const heapLimitBytes = metrics.heapLimitBytes;
  const heapUtilizationPct =
    metrics.memorySupported &&
    typeof memoryBytesToShow === 'number' &&
    typeof heapLimitBytes === 'number' &&
    heapLimitBytes > 0
      ? Math.min(100, Math.round((memoryBytesToShow / heapLimitBytes) * 1000) / 10)
      : null;

  const barWidthPct =
    heapUtilizationPct !== null ? Math.max(3, Math.min(100, heapUtilizationPct)) : 0;

  return (
    <section
      aria-label={t('perf.title')}
      className={`w-full rounded-lg border border-slate-200/90 bg-slate-50/75 px-4 py-3 text-left ${className}`}
    >
      {/* Header Strip (no pill clusters, clean typographic separator) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <h4 className="text-xs font-semibold text-slate-800">{t('perf.title')}</h4>
        </div>
        <span className="text-[11px] text-slate-500">
          {isLive ? t('perf.liveExecution') : t('perf.localExecution')}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5">
        {/* Metric 1: Time Taken */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Timer className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{isLive ? t('perf.elapsedTime') : t('perf.timeTaken')}</span>
          </div>
          <div className="mt-0.5 text-sm font-bold text-slate-900 font-mono tabular-nums">
            {formatDurationMs(resolvedDurationMs)}
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {metrics.operationName || t('perf.zeroUpload')}
          </p>
        </div>

        {/* Metric 2: Browser Memory Usage */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{isLive ? t('perf.liveHeap') : t('perf.peakMemory')}</span>
          </div>
          {metrics.memorySupported && typeof memoryBytesToShow === 'number' ? (
            <>
              <div className="mt-0.5 text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatBytes(memoryBytesToShow)}
              </div>
              <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate mt-0.5">
                {typeof metrics.heapDeltaBytes === 'number'
                  ? `${t('perf.heapDelta')} ${formatSignedMemoryDelta(metrics.heapDeltaBytes)}`
                  : typeof metrics.currentUsedHeapBytes === 'number'
                    ? `${t('perf.currentHeap')} ${formatBytes(metrics.currentUsedHeapBytes)}`
                    : t('perf.jsHeapLabel')}
              </p>
            </>
          ) : (
            <>
              <div className="mt-0.5 text-sm font-bold text-slate-900 font-mono tabular-nums">
                {totalBufferBytes > 0
                  ? formatBytes(totalBufferBytes)
                  : typeof metrics.deviceMemoryGb === 'number'
                    ? `${metrics.deviceMemoryGb} GB RAM`
                    : t('perf.browserManaged')}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {t('perf.heapUnavailable')}
              </p>
            </>
          )}
        </div>

        {/* Metric 3: Heap Utilization or Data Footprint */}
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500 font-medium">
            {heapUtilizationPct !== null ? t('perf.heapQuota') : t('perf.bufferFootprint')}
          </div>
          {heapUtilizationPct !== null && typeof heapLimitBytes === 'number' ? (
            <>
              <div className="mt-0.5 flex items-baseline justify-between gap-2 font-mono tabular-nums">
                <span className="text-sm font-bold text-slate-900">{heapUtilizationPct}%</span>
                <span className="text-[11px] text-slate-500">
                  / {formatBytes(heapLimitBytes)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    heapUtilizationPct > 75 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${barWidthPct}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mt-0.5 text-sm font-bold text-slate-900 font-mono tabular-nums">
                {typeof resolvedOutputBytes === 'number'
                  ? formatBytes(resolvedOutputBytes)
                  : typeof resolvedInputBytes === 'number'
                    ? formatBytes(resolvedInputBytes)
                    : '—'}
              </div>
              <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate mt-0.5">
                {typeof resolvedInputBytes === 'number' && typeof resolvedOutputBytes === 'number'
                  ? `${formatBytes(resolvedInputBytes)} → ${formatBytes(resolvedOutputBytes)}`
                  : typeof resolvedInputBytes === 'number'
                    ? `${t('perf.inputSize')} ${formatBytes(resolvedInputBytes)}`
                    : t('perf.clientRamOnly')}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
