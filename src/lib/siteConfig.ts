/**
 * Central site, domain, operator, AdSense, and CMP configuration.
 * All operator, monetization, and custom-domain fields are optional and driven
 * exclusively by build-time VITE_* environment variables so nothing is fabricated.
 */

export const DEFAULT_PRODUCTION_URL = 'https://bdf-mufv.vercel.app';

export type CmpProviderId = 'none' | 'funding-choices' | 'iab-tcf';

export interface SiteOperatorConfig {
  legalName: string | null;
  supportEmail: string | null;
  privacyEmail: string | null;
  dmcaEmail: string | null;
  address: string | null;
  jurisdiction: string | null;
  effectiveDate: string;
  isConfigured: boolean;
}

export interface SiteAdSenseConfig {
  enabled: boolean;
  /** Normalized "ca-pub-XXXXXXXXXXXXXXXX" for AdSense / Google Funding Choices */
  clientId: string | null;
  /** Normalized "pub-XXXXXXXXXXXXXXXX" for IAB ads.txt */
  publisherId: string | null;
  isConfigured: boolean;
}

export interface SiteCmpConfig {
  provider: CmpProviderId;
  scriptUrl: string | null;
  isConfigured: boolean;
}

export interface SiteConfig {
  brandName: string;
  defaultProductionUrl: string;
  baseUrl: string;
  isCustomDomainActive: boolean;
  operator: SiteOperatorConfig;
  adsense: SiteAdSenseConfig;
  cmp: SiteCmpConfig;
}

function readEnv(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv && typeof metaEnv[key] === 'string') {
      return metaEnv[key];
    }
  } catch {
    // ignore
  }
  try {
    const procEnv =
      typeof process !== 'undefined' && process.env ? process.env : undefined;
    if (procEnv && typeof procEnv[key] === 'string') {
      return procEnv[key];
    }
  } catch {
    // ignore
  }
  return undefined;
}

function cleanText(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(MY_|YOUR_|example|placeholder|changeme)/i.test(trimmed)) return null;
  return trimmed;
}

function cleanEmail(value?: string): string | null {
  const txt = cleanText(value);
  if (!txt) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(txt)) return null;
  if (/example\.(com|org|net)$/i.test(txt)) return null;
  return txt;
}

export function normalizeAdSensePublisherIds(raw?: string): {
  clientId: string | null;
  publisherId: string | null;
} {
  const txt = cleanText(raw);
  if (!txt) return { clientId: null, publisherId: null };
  const match = txt.match(/^(?:ca-)?(pub-\d{16})$/i);
  if (!match) return { clientId: null, publisherId: null };
  const publisherId = match[1].toLowerCase();
  return {
    clientId: `ca-${publisherId}`,
    publisherId,
  };
}

export function isValidProductionUrl(raw?: string): string | null {
  const txt = cleanText(raw);
  if (!txt) return null;
  try {
    const parsed = new URL(txt);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('ais-dev-') ||
      host.endsWith('.run.app')
    ) {
      return null;
    }
    return parsed.origin.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getSiteBaseUrl(): string {
  const explicitSiteUrl =
    isValidProductionUrl(readEnv('VITE_SITE_URL')) ||
    isValidProductionUrl(readEnv('VITE_PUBLIC_SITE_URL'));
  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const browserOrigin = isValidProductionUrl(window.location.origin);
    if (browserOrigin) {
      return browserOrigin;
    }
  }

  return DEFAULT_PRODUCTION_URL;
}

function resolveCmpScriptUrl(
  rawUrl?: string,
  provider?: string,
  clientId?: string | null
): string | null {
  const explicit = cleanText(rawUrl);
  if (explicit) {
    try {
      const parsed = new URL(explicit);
      if (parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      return null;
    }
  }
  if (provider === 'funding-choices' && clientId) {
    return `https://fundingchoicesmessages.google.com/i/${clientId}?ers=1`;
  }
  return null;
}

export function getSiteConfig(): SiteConfig {
  const baseUrl = getSiteBaseUrl();
  const legalName = cleanText(readEnv('VITE_OPERATOR_NAME'));
  const supportEmail = cleanEmail(readEnv('VITE_SUPPORT_EMAIL'));
  const privacyEmail = cleanEmail(readEnv('VITE_PRIVACY_EMAIL')) || supportEmail;
  const dmcaEmail = cleanEmail(readEnv('VITE_DMCA_EMAIL')) || supportEmail;
  const address = cleanText(readEnv('VITE_OPERATOR_ADDRESS'));
  const jurisdiction = cleanText(readEnv('VITE_OPERATOR_JURISDICTION'));
  const effectiveDate = cleanText(readEnv('VITE_EFFECTIVE_DATE')) || 'November 2026';

  const adsEnabledFlag = readEnv('VITE_ADSENSE_ENABLED') === 'true';
  const { clientId, publisherId } = normalizeAdSensePublisherIds(
    readEnv('VITE_ADSENSE_PUBLISHER_ID')
  );
  const adsenseConfigured = Boolean(adsEnabledFlag && clientId && publisherId);

  const rawCmpProvider = (cleanText(readEnv('VITE_CMP_PROVIDER')) || 'none').toLowerCase();
  const cmpProvider: CmpProviderId =
    rawCmpProvider === 'funding-choices'
      ? 'funding-choices'
      : rawCmpProvider === 'iab-tcf'
        ? 'iab-tcf'
        : 'none';
  const cmpScriptUrl = resolveCmpScriptUrl(
    readEnv('VITE_CMP_SCRIPT_URL'),
    cmpProvider,
    clientId
  );

  return {
    brandName: 'PDFQuick',
    defaultProductionUrl: DEFAULT_PRODUCTION_URL,
    baseUrl,
    isCustomDomainActive: baseUrl !== DEFAULT_PRODUCTION_URL,
    operator: {
      legalName,
      supportEmail,
      privacyEmail,
      dmcaEmail,
      address,
      jurisdiction,
      effectiveDate,
      isConfigured: Boolean(legalName && supportEmail),
    },
    adsense: {
      enabled: adsEnabledFlag,
      clientId,
      publisherId,
      isConfigured: adsenseConfigured,
    },
    cmp: {
      provider: cmpProvider,
      scriptUrl: cmpScriptUrl,
      isConfigured: Boolean(cmpScriptUrl),
    },
  };
}
