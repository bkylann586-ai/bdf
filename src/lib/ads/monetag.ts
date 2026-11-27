import { getSavedConsentState, type ConsentState } from '../consent';
import { getSiteConfig, type SiteMonetagConfig } from '../siteConfig';

export const MONETAG_DEFAULT_DOMAIN = 'quge5.com';
export const MONETAG_DEFAULT_ZONE_ID = 316384;
export const MONETAG_DEFAULT_SCRIPT_URL = 'https://quge5.com/88/tag.min.js';
export const MONETAG_ISOLATED_SW_PATH = '/monetag/sw.js';
export const MONETAG_ISOLATED_SW_SCOPE = '/monetag/';

const MONETAG_SCRIPT_SELECTOR = 'script[data-pdfquick-monetag="true"]';
const MONETAG_META_SELECTOR = 'meta[name="monetag"][data-pdfquick-monetag="true"]';
const MONETAG_STATE_EVENT = 'pdfquick:monetag-state';

export type MonetagRuntimeStatus =
  | 'idle'
  | 'blocked_disabled'
  | 'blocked_consent'
  | 'loading'
  | 'active'
  | 'error';

export interface MonetagRuntimeState {
  status: MonetagRuntimeStatus;
  scriptInjected: boolean;
  swRegistrationAttempted: boolean;
  swScope: string | null;
  activeZoneId: number | null;
  activeDomain: string | null;
  lastError: string | null;
}

const INITIAL_STATE: MonetagRuntimeState = {
  status: 'idle',
  scriptInjected: false,
  swRegistrationAttempted: false,
  swScope: null,
  activeZoneId: null,
  activeDomain: null,
  lastError: null,
};

let runtimeState: MonetagRuntimeState = { ...INITIAL_STATE };
let consentListenerAttached = false;
let consentEventHandler: ((ev: Event) => void) | null = null;
let activeSwRegistration: ServiceWorkerRegistration | null = null;

function setRuntimeState(patch: Partial<MonetagRuntimeState>): MonetagRuntimeState {
  runtimeState = {
    ...runtimeState,
    ...patch,
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<MonetagRuntimeState>(MONETAG_STATE_EVENT, { detail: { ...runtimeState } })
    );
  }
  return { ...runtimeState };
}

export function getMonetagState(): MonetagRuntimeState {
  return { ...runtimeState };
}

/**
 * Checks whether Monetag activation is explicitly enabled via VITE_MONETAG_ENABLED
 * and backed by a valid domain (5gvci.com) and zone ID (12336654).
 */
export function isMonetagActivationEnabled(
  config: SiteMonetagConfig = getSiteConfig().monetag
): boolean {
  return Boolean(
    config.enabled &&
      config.isConfigured &&
      config.domain &&
      Number.isFinite(config.zoneId) &&
      config.zoneId > 0
  );
}

/**
 * Verifies explicit CMP / Consent Mode v2 user consent before any Monetag script
 * or isolated worker can be executed.
 */
export function hasExplicitCmpConsent(
  consent: ConsentState = getSavedConsentState()
): boolean {
  return (
    consent.ad_storage === 'granted' &&
    consent.source !== 'default_denied' &&
    Boolean(consent.updatedAt)
  );
}

export function canLoadMonetag(
  config: SiteMonetagConfig = getSiteConfig().monetag,
  consent: ConsentState = getSavedConsentState()
): { allowed: boolean; reason: 'disabled' | 'consent' | 'ok' } {
  // Respect VITE_MONETAG_ENABLED before evaluating consent or DOM injection
  if (!isMonetagActivationEnabled(config)) {
    return { allowed: false, reason: 'disabled' };
  }

  // Always honor an explicit user/CMP opt-out
  const explicitlyDenied =
    consent.ad_storage === 'denied' &&
    consent.source !== 'default_denied' &&
    Boolean(consent.updatedAt);
  if (explicitlyDenied) {
    return { allowed: false, reason: 'consent' };
  }

  // When strict pre-consent gating is requested, wait for explicit grant
  if (config.requireConsent && !hasExplicitCmpConsent(consent)) {
    return { allowed: false, reason: 'consent' };
  }

  return { allowed: true, reason: 'ok' };
}

function ensureVerificationMeta(token: string | null): void {
  if (typeof document === 'undefined' || !token) return;
  const existing = document.querySelector<HTMLMetaElement>('meta[name="monetag"]');
  if (existing) {
    if (existing.content !== token) {
      existing.content = token;
    }
    return;
  }
  const meta = document.createElement('meta');
  meta.name = 'monetag';
  meta.content = token;
  meta.setAttribute('data-pdfquick-monetag', 'true');
  document.head.appendChild(meta);
}

function isIsolatedWorkerTarget(swPath: string, swScope: string): boolean {
  const normalizedPath = swPath.trim();
  const normalizedScope = swScope.trim();
  if (!normalizedPath.startsWith('/') || normalizedPath === '/sw.js') {
    return false;
  }
  if (!normalizedScope.startsWith('/') || normalizedScope === '/') {
    return false;
  }
  return normalizedPath.startsWith(normalizedScope);
}

async function registerIsolatedMonetagWorker(config: SiteMonetagConfig): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (runtimeState.swRegistrationAttempted) return;

  if (!isIsolatedWorkerTarget(config.swPath, config.swScope)) {
    setRuntimeState({
      lastError: 'Blocked non-isolated Monetag service worker scope to protect PWA root /sw.js.',
    });
    return;
  }

  setRuntimeState({ swRegistrationAttempted: true });

  try {
    const expectedScopeUrl = new URL(config.swScope, window.location.origin).href;
    const existingRegs = await navigator.serviceWorker.getRegistrations();
    const existingIsolated = existingRegs.find((reg) => reg.scope === expectedScopeUrl);

    if (existingIsolated) {
      activeSwRegistration = existingIsolated;
      setRuntimeState({ swScope: config.swScope });
      return;
    }

    const registration = await navigator.serviceWorker.register(config.swPath, {
      scope: config.swScope,
      updateViaCache: 'none',
    });

    activeSwRegistration = registration;
    setRuntimeState({ swScope: config.swScope });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Monetag worker registration failed';
    setRuntimeState({ lastError: message });
  }
}

function injectMonetagPageScript(config: SiteMonetagConfig): boolean {
  if (typeof document === 'undefined' || !document.head) return false;
  if (!config.scriptUrl) {
    return false;
  }

  const existing =
    document.head.querySelector<HTMLScriptElement>(MONETAG_SCRIPT_SELECTOR) ||
    document.querySelector<HTMLScriptElement>(
      `${MONETAG_SCRIPT_SELECTOR}, script[data-zone="${config.zoneId}"]`
    );
  if (existing) {
    setRuntimeState({
      status: 'active',
      scriptInjected: true,
      activeZoneId: config.zoneId,
      activeDomain: config.domain,
    });
    return true;
  }

  setRuntimeState({ status: 'loading', lastError: null });

  const script = document.createElement('script');
  script.src = config.scriptUrl;
  script.setAttribute('data-zone', String(config.zoneId));
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  script.setAttribute('data-pdfquick-monetag', 'true');

  script.onload = () => {
    setRuntimeState({
      status: 'active',
      scriptInjected: true,
      activeZoneId: config.zoneId,
      activeDomain: config.domain,
      lastError: null,
    });
  };

  script.onerror = () => {
    setRuntimeState({
      status: 'error',
      scriptInjected: false,
      lastError: `Failed to load Monetag script from ${config.domain}`,
    });
  };

  document.head.appendChild(script);

  setRuntimeState({
    scriptInjected: true,
    activeZoneId: config.zoneId,
    activeDomain: config.domain,
  });
  return true;
}

export async function mountMonetag(
  overrideConsent?: ConsentState
): Promise<MonetagRuntimeState> {
  if (typeof window === 'undefined') {
    return getMonetagState();
  }

  const { monetag } = getSiteConfig();
  const check = canLoadMonetag(monetag, overrideConsent);

  if (!check.allowed) {
    return setRuntimeState({
      status: check.reason === 'disabled' ? 'blocked_disabled' : 'blocked_consent',
      activeZoneId: null,
      activeDomain: null,
    });
  }

  ensureVerificationMeta(monetag.verificationToken);

  const injected = injectMonetagPageScript(monetag);
  await registerIsolatedMonetagWorker(monetag);

  if (!injected && runtimeState.status !== 'error') {
    return setRuntimeState({
      status: monetag.swPath ? 'active' : 'blocked_disabled',
      activeZoneId: monetag.zoneId,
      activeDomain: monetag.domain,
    });
  }

  return getMonetagState();
}

export async function teardownMonetag(): Promise<MonetagRuntimeState> {
  if (typeof document !== 'undefined') {
    const scripts = document.querySelectorAll(MONETAG_SCRIPT_SELECTOR);
    scripts.forEach((node) => node.parentNode?.removeChild(node));

    const injectedMetas = document.querySelectorAll(MONETAG_META_SELECTOR);
    injectedMetas.forEach((node) => node.parentNode?.removeChild(node));
  }

  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  ) {
    try {
      const { monetag } = getSiteConfig();
      const expectedScopeUrl = new URL(monetag.swScope, window.location.origin).href;
      const rootScopeUrl = new URL('/', window.location.origin).href;

      if (activeSwRegistration && activeSwRegistration.scope !== rootScopeUrl) {
        await activeSwRegistration.unregister();
      } else if (expectedScopeUrl !== rootScopeUrl) {
        const regs = await navigator.serviceWorker.getRegistrations();
        const target = regs.find(
          (reg) => reg.scope === expectedScopeUrl && reg.scope !== rootScopeUrl
        );
        if (target) {
          await target.unregister();
        }
      }
    } catch {
      // ignore teardown errors
    }
  }

  activeSwRegistration = null;
  return setRuntimeState({
    status: 'blocked_consent',
    scriptInjected: false,
    swRegistrationAttempted: false,
    swScope: null,
    activeZoneId: null,
    activeDomain: null,
    lastError: null,
  });
}

/**
 * Initialize Monetag lifecycle once in the browser:
 * - Never executes during SSR or when VITE_MONETAG_ENABLED !== 'true'.
 * - Requires explicit CMP consent (ad_storage === 'granted' with non-default updatedAt)
 *   before injecting scripts or registering the isolated /monetag/ Service Worker.
 * - Subscribes to 'pdfquick:consent-updated' for live opt-in and revocation cleanup.
 */
export function initMonetag(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (!consentListenerAttached) {
    consentListenerAttached = true;
    consentEventHandler = (ev: Event) => {
      const detail = (ev as CustomEvent<ConsentState>).detail;
      if (!detail) return;
      const { monetag } = getSiteConfig();
      const check = canLoadMonetag(monetag, detail);
      if (check.allowed) {
        void mountMonetag(detail);
      } else {
        void teardownMonetag();
      }
    };
    window.addEventListener('pdfquick:consent-updated', consentEventHandler);
  }

  void mountMonetag();

  return () => {
    if (consentListenerAttached && consentEventHandler) {
      window.removeEventListener('pdfquick:consent-updated', consentEventHandler);
      consentListenerAttached = false;
      consentEventHandler = null;
    }
  };
}
