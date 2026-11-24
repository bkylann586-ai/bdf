/**
 * PDFQuick Privacy-Preserving Analytics Service
 *
 * Core Principles:
 * 1. Zero document content collection: Never reads, captures, or transmits file contents, text, or file names.
 * 2. Strictly local or anonymized: Aggregate counters stored in client-side localStorage.
 * 3. Transparent: Users can inspect or clear aggregate counters anytime.
 */

export interface AnalyticsEvent {
  type: 'page_view' | 'tool_start' | 'tool_success' | 'tool_error' | 'language_change' | 'sample_used';
  toolId?: string;
  path?: string;
  timestamp: number;
  durationMs?: number;
  pageCount?: number;
  errorType?: string;
  lang?: string;
}

export interface AnalyticsSummary {
  totalOperations: number;
  toolUsageCounts: Record<string, number>;
  totalSuccess: number;
  totalErrors: number;
  lastActive: string | null;
}

const STORAGE_KEY = 'pdfquick_privacy_analytics_v1';
const ANALYTICS_OPT_IN_KEY = 'pdfquick_local_history_opt_in';
const MAX_LOCAL_EVENTS = 50;

/**
 * Local operation history is strictly optional and disabled by default so
 * zero usage metadata or routes are persisted in localStorage unless opted in.
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ANALYTICS_OPT_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAnalyticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(ANALYTICS_OPT_IN_KEY, 'true');
    } else {
      localStorage.removeItem(ANALYTICS_OPT_IN_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function getStoredData(): { summary: AnalyticsSummary; recentEvents: AnalyticsEvent[] } {
  if (typeof window === 'undefined' || !isAnalyticsEnabled()) {
    return {
      summary: { totalOperations: 0, toolUsageCounts: {}, totalSuccess: 0, totalErrors: 0, lastActive: null },
      recentEvents: [],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  return {
    summary: { totalOperations: 0, toolUsageCounts: {}, totalSuccess: 0, totalErrors: 0, lastActive: null },
    recentEvents: [],
  };
}

function saveStoredData(data: { summary: AnalyticsSummary; recentEvents: AnalyticsEvent[] }): void {
  if (typeof window === 'undefined' || !isAnalyticsEnabled()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or private mode
  }
}

function dispatchAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('pdfquick:analytics', { detail: event }));
  } catch {
    // ignore
  }
}

/**
 * Record a page view (only relative application route paths, e.g. /merge-pdf) when opted in
 */
export function trackPageView(path: string): void {
  if (!isAnalyticsEnabled()) return;
  const event: AnalyticsEvent = {
    type: 'page_view',
    path: path.split('?')[0],
    timestamp: Date.now(),
  };

  const data = getStoredData();
  data.recentEvents = [event, ...data.recentEvents.slice(0, MAX_LOCAL_EVENTS - 1)];
  data.summary.lastActive = new Date().toISOString();
  saveStoredData(data);
  dispatchAnalyticsEvent(event);
}

/**
 * Record the start of a PDF operation (tool category only; zero file names/content) when opted in
 */
export function trackToolStart(toolId: string): void {
  if (!isAnalyticsEnabled()) return;
  const event: AnalyticsEvent = {
    type: 'tool_start',
    toolId,
    timestamp: Date.now(),
  };

  const data = getStoredData();
  data.summary.totalOperations = (data.summary.totalOperations || 0) + 1;
  data.summary.toolUsageCounts[toolId] = (data.summary.toolUsageCounts[toolId] || 0) + 1;
  data.summary.lastActive = new Date().toISOString();
  data.recentEvents = [event, ...data.recentEvents.slice(0, MAX_LOCAL_EVENTS - 1)];
  saveStoredData(data);
  dispatchAnalyticsEvent(event);
}

/**
 * Record successful completion of a tool operation
 */
export function trackToolSuccess(
  toolId: string,
  meta?: { durationMs?: number; pageCount?: number }
): void {
  if (!isAnalyticsEnabled()) return;
  const event: AnalyticsEvent = {
    type: 'tool_success',
    toolId,
    timestamp: Date.now(),
    durationMs: meta?.durationMs,
    pageCount: meta?.pageCount,
  };

  const data = getStoredData();
  data.summary.totalSuccess = (data.summary.totalSuccess || 0) + 1;
  data.summary.lastActive = new Date().toISOString();
  data.recentEvents = [event, ...data.recentEvents.slice(0, MAX_LOCAL_EVENTS - 1)];
  saveStoredData(data);
  dispatchAnalyticsEvent(event);
}

/**
 * Record tool error or failure without capturing any file content
 */
export function trackToolError(toolId: string, errorType?: string): void {
  if (!isAnalyticsEnabled()) return;
  const event: AnalyticsEvent = {
    type: 'tool_error',
    toolId,
    timestamp: Date.now(),
    errorType: errorType || 'GeneralError',
  };

  const data = getStoredData();
  data.summary.totalErrors = (data.summary.totalErrors || 0) + 1;
  data.summary.lastActive = new Date().toISOString();
  data.recentEvents = [event, ...data.recentEvents.slice(0, MAX_LOCAL_EVENTS - 1)];
  saveStoredData(data);
  dispatchAnalyticsEvent(event);
}

/**
 * Record user language preference change
 */
export function trackLanguageSwitch(lang: string): void {
  if (!isAnalyticsEnabled()) return;
  const event: AnalyticsEvent = {
    type: 'language_change',
    lang,
    timestamp: Date.now(),
  };

  const data = getStoredData();
  data.summary.lastActive = new Date().toISOString();
  data.recentEvents = [event, ...data.recentEvents.slice(0, MAX_LOCAL_EVENTS - 1)];
  saveStoredData(data);
  dispatchAnalyticsEvent(event);
}

/**
 * Record when sample document is loaded to test tool
 */
export function trackSampleUse(toolId: string): void {
  if (!isAnalyticsEnabled()) return;
  const event: AnalyticsEvent = {
    type: 'sample_used',
    toolId,
    timestamp: Date.now(),
  };

  const data = getStoredData();
  data.summary.lastActive = new Date().toISOString();
  data.recentEvents = [event, ...data.recentEvents.slice(0, MAX_LOCAL_EVENTS - 1)];
  saveStoredData(data);
  dispatchAnalyticsEvent(event);
}

/**
 * Retrieve anonymous summary of tool metrics
 */
export function getAnalyticsSummary(): AnalyticsSummary {
  return getStoredData().summary;
}

/**
 * Clear all locally stored telemetry
 */
export function clearAnalyticsData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
