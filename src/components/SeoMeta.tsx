import React, { createContext, useContext, useEffect } from 'react';
import {
  buildFaqSchemaJsonLd,
  DEFAULT_FAQ_SCHEMA_SCRIPT_ID,
  FaqSchemaItem,
} from '../lib/faqSchema';
import {
  DEFAULT_PRODUCTION_URL,
  getSiteBaseUrl,
  getSiteConfig,
} from '../lib/siteConfig';

interface SeoMetaProps {
  title: string;
  description: string;
  path: string;
  schema?: Record<string, any>;
  faqs?: FaqSchemaItem[];
  noindex?: boolean;
}

export interface SeoHeadSnapshot {
  title: string;
  description: string;
  canonicalHref: string | null;
  noindex: boolean;
  schema: Record<string, any> | null;
  faqSchema: Record<string, any> | null;
}

export interface SeoHeadCollector {
  snapshot: SeoHeadSnapshot | null;
}

const SeoCollectorContext = createContext<SeoHeadCollector | null>(null);

export const SeoCollectorProvider: React.FC<{
  collector: SeoHeadCollector;
  children: React.ReactNode;
}> = ({ collector, children }) => {
  return <SeoCollectorContext.Provider value={collector}>{children}</SeoCollectorContext.Provider>;
};

export const VERIFIED_PRODUCTION_DOMAIN = DEFAULT_PRODUCTION_URL;

export function getProductionBaseUrl(): string {
  return getSiteBaseUrl();
}

export function buildCanonicalHref(path: string, baseUrl = getProductionBaseUrl()): string {
  const raw = (path || '/').split('?')[0].split('#')[0].trim();
  const normalized = raw.startsWith('/') ? raw : `/${raw.replace(/^#\/?/, '')}`;
  const trimmed = normalized.replace(/\/+$/, '') || '/';
  return trimmed === '/' ? `${baseUrl}/` : `${baseUrl}${trimmed}`;
}

export function buildOrganizationSchema(baseUrl = getProductionBaseUrl()): Record<string, any> {
  const { operator } = getSiteConfig();
  const org: Record<string, any> = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: operator.legalName || 'PDFQuick',
    url: `${baseUrl}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icon.svg`,
    },
    description:
      'Independent browser-based PDF tools and financial document privacy utilities processed 100% locally inside browser memory.',
  };
  if (operator.supportEmail) {
    org.email = operator.supportEmail;
  }
  return org;
}

export function buildBreadcrumbSchema(
  items: { name: string; path: string }[],
  baseUrl = VERIFIED_PRODUCTION_DOMAIN
): Record<string, any> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalHref(item.path, baseUrl),
    })),
  };
}

export const SeoMeta: React.FC<SeoMetaProps> = ({
  title,
  description,
  path,
  schema,
  faqs,
  noindex = false,
}) => {
  const collector = useContext(SeoCollectorContext);
  const baseUrl = getProductionBaseUrl();
  const canonicalHref = noindex ? null : buildCanonicalHref(path, baseUrl);

  const resolvedSchema = noindex
    ? null
    : schema || {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'PDFQuick',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All modern web browsers',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description,
        browserRequirements: 'Requires JavaScript and HTML5 Canvas support.',
        url: canonicalHref,
      };

  const resolvedFaqSchema =
    !noindex && faqs && faqs.length > 0
      ? buildFaqSchemaJsonLd(faqs, canonicalHref || undefined)
      : null;

  // Record head metadata synchronously during SSR pre-rendering
  if (collector) {
    collector.snapshot = {
      title,
      description,
      canonicalHref,
      noindex,
      schema: resolvedSchema,
      faqSchema: resolvedFaqSchema,
    };
  }

  useEffect(() => {
    // 1. Page Title
    document.title = title;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Robots meta (noindex, nofollow for 404 views)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow');

    // 4. OpenGraph Title, Description & Social Share Image (1200x630)
    const ogImageHref = `${baseUrl}/og-image.png`;
    const upsertMetaByProp = (prop: string, content: string) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    const upsertMetaByName = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    upsertMetaByProp('og:title', title);
    upsertMetaByProp('og:description', description);
    upsertMetaByProp('og:image', ogImageHref);
    upsertMetaByProp('og:image:width', '1200');
    upsertMetaByProp('og:image:height', '630');
    upsertMetaByProp('og:image:type', 'image/png');
    upsertMetaByProp('og:image:alt', 'PDFQuick – Free, Private Online PDF and Financial Document Tools');

    // 5. Canonical URL & OpenGraph URL (removed cleanly on 404/noindex pages)
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');

    if (canonicalHref) {
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonicalHref);
      } else {
        const newCanonical = document.createElement('link');
        newCanonical.setAttribute('rel', 'canonical');
        newCanonical.setAttribute('href', canonicalHref);
        document.head.appendChild(newCanonical);
      }

      if (ogUrl) {
        ogUrl.setAttribute('content', canonicalHref);
      } else {
        const newOgUrl = document.createElement('meta');
        newOgUrl.setAttribute('property', 'og:url');
        newOgUrl.setAttribute('content', canonicalHref);
        document.head.appendChild(newOgUrl);
      }
    } else {
      if (canonicalLink) canonicalLink.remove();
      if (ogUrl) ogUrl.remove();
    }

    // 6. Twitter Card Tags
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', description);
    upsertMetaByName('twitter:image', ogImageHref);
    upsertMetaByName('twitter:image:alt', 'PDFQuick – Free, Private Online PDF and Financial Document Tools');

    // 7. Valid Hreflang Tags: only 'en' and 'x-default' (all public URLs serve English HTML).
    // Clean up any stale non-existent language hreflang tags (es/fr/ar/de) if previously injected.
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((el) => {
        const hl = el.getAttribute('hreflang');
        if (noindex || (hl !== 'en' && hl !== 'x-default')) {
          el.remove();
        }
      });

    if (canonicalHref && !noindex) {
      const upsertHreflang = (langCode: 'en' | 'x-default') => {
        let tag = document.querySelector(
          `link[rel="alternate"][hreflang="${langCode}"]`
        ) as HTMLLinkElement | null;
        if (!tag) {
          tag = document.createElement('link');
          tag.id = `pdfquick-hreflang-${langCode}`;
          tag.rel = 'alternate';
          tag.hreflang = langCode;
          document.head.appendChild(tag);
        }
        tag.href = canonicalHref;
      };
      upsertHreflang('en');
      upsertHreflang('x-default');
    }

    // 8. Schema.org JSON-LD Structured Data
    const scriptId = 'pdfquick-seo-structured-data';
    let scriptElem = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!noindex && resolvedSchema) {
      if (!scriptElem) {
        scriptElem = document.createElement('script');
        scriptElem.id = scriptId;
        scriptElem.type = 'application/ld+json';
        document.head.appendChild(scriptElem);
      }
      scriptElem.textContent = JSON.stringify(resolvedSchema);
    } else if (scriptElem) {
      scriptElem.remove();
    }

    // 9. Optional FAQPage JSON-LD synced with visible FAQ items
    if (resolvedFaqSchema) {
      let faqScript = document.getElementById(
        DEFAULT_FAQ_SCHEMA_SCRIPT_ID
      ) as HTMLScriptElement | null;
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.id = DEFAULT_FAQ_SCHEMA_SCRIPT_ID;
        faqScript.type = 'application/ld+json';
        document.head.appendChild(faqScript);
      }
      faqScript.setAttribute('data-tool', path.replace(/^\//, '') || 'home');
      faqScript.textContent = JSON.stringify(resolvedFaqSchema);
    }
  }, [title, description, path, canonicalHref, noindex, resolvedSchema, resolvedFaqSchema]);

  return null;
};
