import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { formatBytes } from './fileHelpers';

export interface BrowserMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface BrowserMemorySnapshot {
  supported: boolean;
  usedHeapBytes?: number;
  totalHeapBytes?: number;
  heapLimitBytes?: number;
  deviceMemoryGb?: number;
}

export type PerformanceRunStatus = 'idle' | 'running' | 'completed';

export interface PerformanceMetricsSnapshot {
  status: PerformanceRunStatus;
  operationName?: string;
  durationMs: number;
  memorySupported: boolean;
  startUsedHeapBytes?: number;
  currentUsedHeapBytes?: number;
  peakUsedHeapBytes?: number;
  totalHeapBytes?: number;
  heapLimitBytes?: number;
  heapDeltaBytes?: number;
  deviceMemoryGb?: number;
  inputBytes?: number;
  outputBytes?: number;
}

export interface StartPerformanceRunOptions {
  operationName?: string;
  inputBytes?: number;
}

export interface FinishPerformanceRunOptions {
  durationMsOverride?: number;
  inputBytes?: number;
  outputBytes?: number;
}

interface PerformanceMonitorContextValue {
  metrics: PerformanceMetricsSnapshot;
  startRun: (options?: StartPerformanceRunOptions) => void;
  updateRunMeta: (meta: { inputBytes?: number; outputBytes?: number; operationName?: string }) => void;
  finishRun: (options?: FinishPerformanceRunOptions) => void;
  resetRun: () => void;
}

const SAMPLE_INTERVAL_MS = 200;

export function readBrowserMemorySnapshot(): BrowserMemorySnapshot {
  let deviceMemoryGb: number | undefined;
  if (typeof navigator !== 'undefined') {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === 'number' && Number.isFinite(nav.deviceMemory) && nav.deviceMemory > 0) {
      deviceMemoryGb = nav.deviceMemory;
    }
  }

  if (typeof performance !== 'undefined') {
    const perfWithMem = performance as Performance & { memory?: Partial<BrowserMemoryInfo> };
    const mem = perfWithMem.memory;
    if (
      mem &&
      typeof mem.usedJSHeapSize === 'number' &&
      Number.isFinite(mem.usedJSHeapSize) &&
      mem.usedJSHeapSize >= 0
    ) {
      return {
        supported: true,
        usedHeapBytes: mem.usedJSHeapSize,
        totalHeapBytes:
          typeof mem.totalJSHeapSize === 'number' && Number.isFinite(mem.totalJSHeapSize)
            ? mem.totalJSHeapSize
            : undefined,
        heapLimitBytes:
          typeof mem.jsHeapSizeLimit === 'number' && Number.isFinite(mem.jsHeapSizeLimit)
            ? mem.jsHeapSizeLimit
            : undefined,
        deviceMemoryGb,
      };
    }
  }

  return {
    supported: false,
    deviceMemoryGb,
  };
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

export function formatSignedMemoryDelta(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
  const sign = bytes > 0 ? '+' : '-';
  return `${sign}${formatBytes(Math.abs(bytes))}`;
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function createInitialSnapshot(): PerformanceMetricsSnapshot {
  const mem = readBrowserMemorySnapshot();
  return {
    status: 'idle',
    durationMs: 0,
    memorySupported: mem.supported,
    currentUsedHeapBytes: mem.usedHeapBytes,
    totalHeapBytes: mem.totalHeapBytes,
    heapLimitBytes: mem.heapLimitBytes,
    deviceMemoryGb: mem.deviceMemoryGb,
  };
}

const noop = () => {};

const PerformanceMonitorContext = createContext<PerformanceMonitorContextValue>({
  metrics: {
    status: 'idle',
    durationMs: 0,
    memorySupported: false,
  },
  startRun: noop,
  updateRunMeta: noop,
  finishRun: noop,
  resetRun: noop,
});

export const PerformanceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetricsSnapshot>(() => createInitialSnapshot());
  const metricsRef = useRef<PerformanceMetricsSnapshot>(metrics);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const commitMetrics = useCallback((next: PerformanceMetricsSnapshot) => {
    metricsRef.current = next;
    setMetrics(next);
  }, []);

  const stopSampling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const sampleRunningMetrics = useCallback(() => {
    if (startTimeRef.current === null) return;
    const prev = metricsRef.current;
    if (prev.status !== 'running') return;

    const mem = readBrowserMemorySnapshot();
    const elapsed = Math.max(0, nowMs() - startTimeRef.current);
    const peak =
      mem.supported && typeof mem.usedHeapBytes === 'number'
        ? Math.max(prev.peakUsedHeapBytes ?? 0, mem.usedHeapBytes)
        : prev.peakUsedHeapBytes;
    const delta =
      mem.supported &&
      typeof mem.usedHeapBytes === 'number' &&
      typeof prev.startUsedHeapBytes === 'number'
        ? mem.usedHeapBytes - prev.startUsedHeapBytes
        : prev.heapDeltaBytes;

    commitMetrics({
      ...prev,
      durationMs: elapsed,
      memorySupported: mem.supported,
      currentUsedHeapBytes: mem.usedHeapBytes ?? prev.currentUsedHeapBytes,
      peakUsedHeapBytes: peak,
      totalHeapBytes: mem.totalHeapBytes ?? prev.totalHeapBytes,
      heapLimitBytes: mem.heapLimitBytes ?? prev.heapLimitBytes,
      heapDeltaBytes: delta,
      deviceMemoryGb: mem.deviceMemoryGb ?? prev.deviceMemoryGb,
    });
  }, [commitMetrics]);

  const startRun = useCallback(
    (options?: StartPerformanceRunOptions) => {
      stopSampling();
      const mem = readBrowserMemorySnapshot();
      const started = nowMs();
      startTimeRef.current = started;

      commitMetrics({
        status: 'running',
        operationName: options?.operationName,
        durationMs: 0,
        memorySupported: mem.supported,
        startUsedHeapBytes: mem.usedHeapBytes,
        currentUsedHeapBytes: mem.usedHeapBytes,
        peakUsedHeapBytes: mem.usedHeapBytes,
        totalHeapBytes: mem.totalHeapBytes,
        heapLimitBytes: mem.heapLimitBytes,
        heapDeltaBytes: mem.supported ? 0 : undefined,
        deviceMemoryGb: mem.deviceMemoryGb,
        inputBytes: options?.inputBytes,
        outputBytes: undefined,
      });

      intervalRef.current = setInterval(sampleRunningMetrics, SAMPLE_INTERVAL_MS);
    },
    [commitMetrics, sampleRunningMetrics, stopSampling]
  );

  const updateRunMeta = useCallback(
    (meta: { inputBytes?: number; outputBytes?: number; operationName?: string }) => {
      const prev = metricsRef.current;
      commitMetrics({
        ...prev,
        operationName: meta.operationName ?? prev.operationName,
        inputBytes: meta.inputBytes ?? prev.inputBytes,
        outputBytes: meta.outputBytes ?? prev.outputBytes,
      });
    },
    [commitMetrics]
  );

  const finishRun = useCallback(
    (options?: FinishPerformanceRunOptions) => {
      stopSampling();
      const prev = metricsRef.current;
      const mem = readBrowserMemorySnapshot();
      const computedDuration =
        typeof options?.durationMsOverride === 'number'
          ? Math.max(0, options.durationMsOverride)
          : startTimeRef.current !== null
            ? Math.max(0, nowMs() - startTimeRef.current)
            : prev.durationMs;

      startTimeRef.current = null;

      const peak =
        mem.supported && typeof mem.usedHeapBytes === 'number'
          ? Math.max(prev.peakUsedHeapBytes ?? 0, mem.usedHeapBytes)
          : prev.peakUsedHeapBytes;
      const delta =
        mem.supported &&
        typeof peak === 'number' &&
        typeof prev.startUsedHeapBytes === 'number'
          ? peak - prev.startUsedHeapBytes
          : prev.heapDeltaBytes;

      commitMetrics({
        ...prev,
        status: 'completed',
        durationMs: computedDuration,
        memorySupported: mem.supported,
        currentUsedHeapBytes: mem.usedHeapBytes ?? prev.currentUsedHeapBytes,
        peakUsedHeapBytes: peak,
        totalHeapBytes: mem.totalHeapBytes ?? prev.totalHeapBytes,
        heapLimitBytes: mem.heapLimitBytes ?? prev.heapLimitBytes,
        heapDeltaBytes: delta,
        deviceMemoryGb: mem.deviceMemoryGb ?? prev.deviceMemoryGb,
        inputBytes: options?.inputBytes ?? prev.inputBytes,
        outputBytes: options?.outputBytes ?? prev.outputBytes,
      });
    },
    [commitMetrics, stopSampling]
  );

  const resetRun = useCallback(() => {
    stopSampling();
    startTimeRef.current = null;
    commitMetrics(createInitialSnapshot());
  }, [commitMetrics, stopSampling]);

  useEffect(() => {
    return () => {
      stopSampling();
    };
  }, [stopSampling]);

  return (
    <PerformanceMonitorContext.Provider
      value={{ metrics, startRun, updateRunMeta, finishRun, resetRun }}
    >
      {children}
    </PerformanceMonitorContext.Provider>
  );
};

export function usePerformanceMonitor(): PerformanceMonitorContextValue {
  return useContext(PerformanceMonitorContext);
}
