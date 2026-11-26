/**
 * Google Consent Mode v2 + External CMP (Funding Choices / IAB TCF v2.2) Integration
 *
 * Design guarantees:
 * - Zero tracking requests or ad scripts are executed by default.
 * - EEA/UK/CH visitors default to 'denied' for ad_storage, ad_user_data,
 *   ad_personalization, and analytics_storage before any ad/CMP scripts load.
 * - Does NOT claim Google CMP certification on its own; certification applies only
 *   when an external CMP listed on Google's certified CMP registry (such as Google
 *   Funding Choices or a verified IAB TCF v2.2 CMP) is activated by the owner.
 */

import { getSiteConfig } from './siteConfig';

export type ConsentSignal = 'denied' | 'granted';

export interface ConsentState {
  ad_storage: ConsentSignal;
  ad_user_data: ConsentSignal;
  ad_personalization: ConsentSignal;
  analytics_storage: ConsentSignal;
  source: 'default_denied' | 'tcf_cmp' | 'user_preference';
  updatedAt: string | null;
}

export const EEA_UK_CH_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
  'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'GB', 'CH',
] as const;

const CONSENT_STORAGE_KEY = 'pdfquick_consent_v1';

export const DEFAULT_DENIED_CONSENT: ConsentState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  source: 'default_denied',
  updatedAt: null,
};

interface GoogleFcApi {
  callbackQueue?: Array<() => void>;
  showRevocationMessage?: () => void;
}

interface TcfData {
  cmpId?: number;
  cmpStatus?: string;
  eventStatus?: string;
  gdprApplies?: boolean;
  tcString?: string;
  purpose?: {
    consents?: Record<string, boolean>;
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __pdfquickConsentDefaultSet?: boolean;
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: TcfData | null, success: boolean) => void
    ) => void;
    googlefc?: GoogleFcApi;
    Cookiebot?: { renew?: () => void };
    UC_UI?: { showSecondLayer?: () => void };
    Didomi?: { preferences?: { show?: () => void } };
  }
}

function ensureGtagQueue(): (...args: unknown[]) => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
  return window.gtag;
}

export function getSavedConsentState(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT_DENIED_CONSENT;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_DENIED_CONSENT;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (
      (parsed.ad_storage === 'granted' || parsed.ad_storage === 'denied') &&
      (parsed.ad_user_data === 'granted' || parsed.ad_user_data === 'denied') &&
      (parsed.ad_personalization === 'granted' || parsed.ad_personalization === 'denied') &&
      (parsed.analytics_storage === 'granted' || parsed.analytics_storage === 'denied')
    ) {
      return {
        ad_storage: parsed.ad_storage,
        ad_user_data: parsed.ad_user_data,
        ad_personalization: parsed.ad_personalization,
        analytics_storage: parsed.analytics_storage,
        source: parsed.source || 'user_preference',
        updatedAt: parsed.updatedAt || null,
      };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_DENIED_CONSENT;
}

export function applyConsentModeUpdate(next: ConsentState): void {
  if (typeof window === 'undefined') return;
  const gtag = ensureGtagQueue();
  gtag('consent', 'update', {
    ad_storage: next.ad_storage,
    ad_user_data: next.ad_user_data,
    ad_personalization: next.ad_personalization,
    analytics_storage: next.analytics_storage,
  });
  window.dispatchEvent(new CustomEvent('pdfquick:consent-updated', { detail: next }));
}

export function saveConsentPreference(
  partial: Pick<ConsentState, 'ad_storage' | 'ad_user_data' | 'ad_personalization' | 'analytics_storage'>,
  source: ConsentState['source'] = 'user_preference'
): ConsentState {
  const next: ConsentState = {
    ...partial,
    source,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    applyConsentModeUpdate(next);
  }

  return next;
}

export function resetConsentPreference(): ConsentState {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // ignore
    }
    applyConsentModeUpdate(DEFAULT_DENIED_CONSENT);
  }
  return DEFAULT_DENIED_CONSENT;
}

let initialized = false;
let observedTcfCmpId: number | null = null;
let observedTcfString = false;

function handleTcfPayload(tcData: TcfData | null, success: boolean): void {
  if (!success || !tcData) return;
  if (typeof tcData.cmpId === 'number' && tcData.cmpId > 0) {
    observedTcfCmpId = tcData.cmpId;
  }
  if (typeof tcData.tcString === 'string' && tcData.tcString.length > 0) {
    observedTcfString = true;
  }
  if (tcData.eventStatus === 'useractioncomplete' || tcData.eventStatus === 'tcloaded') {
    const consents = tcData.purpose?.consents || {};
    const gdprApplies = tcData.gdprApplies !== false;
    const hasPurpose1 = !gdprApplies || Boolean(consents['1']);
    const hasPersonalization = !gdprApplies || (Boolean(consents['3']) && Boolean(consents['4']));
    saveConsentPreference(
      {
        ad_storage: hasPurpose1 ? 'granted' : 'denied',
        ad_user_data: hasPurpose1 ? 'granted' : 'denied',
        ad_personalization: hasPersonalization ? 'granted' : 'denied',
        analytics_storage: hasPurpose1 ? 'granted' : 'denied',
      },
      'tcf_cmp'
    );
  }
}

/**
 * Ensure Google Consent Mode v2 default state is set in memory (idempotent if already set in <head>).
 * Does NOT load any external tracking or ad scripts unless explicitly configured by owner env vars.
 */
export function initConsentDefaults(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const gtag = ensureGtagQueue();
  if (!window.__pdfquickConsentDefaultSet) {
    window.__pdfquickConsentDefaultSet = true;
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
      region: [...EEA_UK_CH_REGIONS],
    });

    const saved = getSavedConsentState();
    if (saved.updatedAt) {
      applyConsentModeUpdate(saved);
    }
  }

  // Subscribe to an active external IAB TCF v2.2 CMP using standard TCF v2.2 commands
  if (typeof window.__tcfapi === 'function') {
    try {
      window.__tcfapi('getTCData', 2, handleTcfPayload);
      window.__tcfapi('addEventListener', 2, handleTcfPayload);
    } catch {
      // ignore malformed third-party CMP listener
    }
  }
}

export interface CmpIntegrationStatus {
  hasLiveTcfApi: boolean;
  tcfCmpId: number | null;
  hasValidTcfString: boolean;
  hasGoogleFundingChoices: boolean;
  isExternalCmpActive: boolean;
  configuredProvider: string;
  adsenseConfigured: boolean;
}

export function getCmpIntegrationStatus(): CmpIntegrationStatus {
  const cfg = getSiteConfig();
  const hasLiveTcfApi =
    typeof window !== 'undefined' && typeof window.__tcfapi === 'function';
  const hasGoogleFundingChoices =
    typeof window !== 'undefined' &&
    typeof window.googlefc === 'object' &&
    window.googlefc !== null;
  const isExternalCmpActive =
    hasGoogleFundingChoices || (hasLiveTcfApi && observedTcfCmpId !== null && observedTcfCmpId > 0);

  return {
    hasLiveTcfApi,
    tcfCmpId: observedTcfCmpId,
    hasValidTcfString: observedTcfString,
    hasGoogleFundingChoices,
    isExternalCmpActive,
    configuredProvider: cfg.cmp.provider,
    adsenseConfigured: cfg.adsense.isConfigured,
  };
}

/**
 * Open an active external CMP's revocation/preferences dialog (Funding Choices,
 * Cookiebot, Usercentrics, or Didomi) if loaded on the page, or invoke fallback.
 */
export function openCmpPreferences(fallback?: () => void): boolean {
  if (typeof window === 'undefined') return false;

  if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
    window.googlefc.showRevocationMessage();
    return true;
  }

  if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
    window.Cookiebot.renew();
    return true;
  }

  if (window.UC_UI && typeof window.UC_UI.showSecondLayer === 'function') {
    window.UC_UI.showSecondLayer();
    return true;
  }

  if (window.Didomi?.preferences && typeof window.Didomi.preferences.show === 'function') {
    window.Didomi.preferences.show();
    return true;
  }

  if (fallback) {
    fallback();
  }
  return false;
}
