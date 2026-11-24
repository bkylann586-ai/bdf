import React, { useEffect } from 'react';
import { LANGUAGES } from '../lib/i18n';

interface SeoMetaProps {
  title: string;
  description: string;
  path: string;
  schema?: Record<string, any>;
  noindex?: boolean;
}

export const VERIFIED_PRODUCTION_DOMAIN = 'https://ais-pre-2e4cswqli4ogjyk4wkg2qg-52008683268.europe-west2.run.app';

export function getProductionBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }
  return VERIFIED_PRODUCTION_DOMAIN;
}

export const SeoMeta: React.FC<SeoMetaProps> = ({
  title,
  description,
  path,
  schema,
  noindex = false,
}) => {
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

    // 3. Robots meta (noindex for 404 views)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.setAttribute('content', 'index, follow');
    }

    // 4. OpenGraph Title & Description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // 5. Dynamic Canonical URL
    const baseUrl = getProductionBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path.replace(/^#\/?/, '')}`;
    const canonicalHref = `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalHref);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalHref);

    // 6. Twitter Card Tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);

    // 7. Multilingual Hreflang Tags for SEO
    LANGUAGES.forEach((lang) => {
      const id = `pdfquick-hreflang-${lang.code}`;
      let hrefLangTag = document.getElementById(id) as HTMLLinkElement | null;
      if (!hrefLangTag) {
        hrefLangTag = document.createElement('link');
        hrefLangTag.id = id;
        hrefLangTag.rel = 'alternate';
        hrefLangTag.hreflang = lang.code;
        document.head.appendChild(hrefLangTag);
      }
      hrefLangTag.href = canonicalHref;
    });

    let xDefaultTag = document.getElementById('pdfquick-hreflang-x-default') as HTMLLinkElement | null;
    if (!xDefaultTag) {
      xDefaultTag = document.createElement('link');
      xDefaultTag.id = 'pdfquick-hreflang-x-default';
      xDefaultTag.rel = 'alternate';
      xDefaultTag.hreflang = 'x-default';
      document.head.appendChild(xDefaultTag);
    }
    xDefaultTag.href = canonicalHref;

    // 8. Schema.org JSON-LD Structured Data
    const scriptId = 'pdfquick-seo-structured-data';
    let scriptElem = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!noindex) {
      if (!scriptElem) {
        scriptElem = document.createElement('script');
        scriptElem.id = scriptId;
        scriptElem.type = 'application/ld+json';
        document.head.appendChild(scriptElem);
      }

      const defaultSchema = {
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

      scriptElem.textContent = JSON.stringify(schema || defaultSchema);
    } else if (scriptElem) {
      scriptElem.remove();
    }
  }, [title, description, path, schema, noindex]);

  return null;
};
