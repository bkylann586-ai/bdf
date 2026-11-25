/**
 * Google Consent Mode v2 + Google-Certified CMP (Funding Choices / IAB TCF v2.2) Integration
 *
 * Design guarantees:
 * - Zero tracking requests or ad scripts are executed by default.
 * - EEA/UK/CH visitors default to 'denied' for ad_storage, ad_user_data,
 *   ad_personalization, and analytics_storage until explicit consent is granted.
 * - Interoperates cleanly with Google Funding Choices (window.googlefc) and any
 *   IAB TCF v2.2 certified CMP exposing window.__tcfapi when enabled by the owner.
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
  eventStatus?: string;
  gdprApplies?: boolean;
  purpose?: {
    consents?: Record<string, boolean>;
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: TcfData | null, success: boolean) => void
    ) => void;
    googlefc?: GoogleFcApi;
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

/**
 * Initialize Google Consent Mode v2 default state in memory (denied by default for EEA/UK/CH).
 * Does NOT load any external tracking or ad scripts unless explicitly configured by owner env vars.
 */
export function initConsentDefaults(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  const gtag = ensureGtagQueue();
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

  // Subscribe to any Google-certified IAB TCF v2.2 CMP if loaded by production host
  if (typeof window.__tcfapi === 'function') {
    try {
      window.__tcfapi('addEventListener', 2, (tcData, success) => {
        if (!success || !tcData) return;
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
      });
    } catch {
      // ignore malformed third-party CMP listener
    }
  }
}

export function getCmpIntegrationStatus(): {
  hasLiveTcfApi: boolean;
  hasGoogleFundingChoices: boolean;
  configuredProvider: string;
  adsenseConfigured: boolean;
} {
  const cfg = getSiteConfig();
  const hasLiveTcfApi =
    typeof window !== 'undefined' && typeof window.__tcfapi === 'function';
  const hasGoogleFundingChoices =
    typeof window !== 'undefined' && Boolean(window.googlefc);

  return {
    hasLiveTcfApi,
    hasGoogleFundingChoices,
    configuredProvider: cfg.cmp.provider,
    adsenseConfigured: cfg.adsense.isConfigured,
  };
}

/**
 * Open the active Google-certified CMP revocation/preferences dialog if present,
 * or invoke the fallback callback (e.g., scroll/navigate to Privacy & Consent controls).
 */
export function openCmpPreferences(fallback?: () => void): boolean {
  if (typeof window === 'undefined') return false;

  if (window.googlefc && typeof window.googlefc.showRevocationMessage === 'function') {
    window.googlefc.showRevocationMessage();
    return true;
  }

  if (typeof window.__tcfapi === 'function') {
    try {
      window.__tcfapi('displayConsentUi', 2, () => {});
      return true;
    } catch {
      // fall through
    }
  }

  if (fallback) {
    fallback();
  }
  return false;
}
