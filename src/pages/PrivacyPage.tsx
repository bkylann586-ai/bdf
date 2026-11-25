import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  EyeOff,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { getSiteConfig } from '../lib/siteConfig';
import {
  ConsentState,
  DEFAULT_DENIED_CONSENT,
  getCmpIntegrationStatus,
  getSavedConsentState,
  openCmpPreferences,
  resetConsentPreference,
  saveConsentPreference,
} from '../lib/consent';

export const PrivacyPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
  const { operator, cmp, adsense } = getSiteConfig();

  const [consentState, setConsentState] = useState<ConsentState>(DEFAULT_DENIED_CONSENT);
  const [cmpStatus, setCmpStatus] = useState({
    hasLiveTcfApi: false,
    hasGoogleFundingChoices: false,
    configuredProvider: cmp.provider as string,
    adsenseConfigured: adsense.isConfigured,
  });
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setConsentState(getSavedConsentState());
    setCmpStatus(getCmpIntegrationStatus());

    const handleConsentUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<ConsentState>).detail;
      if (detail) setConsentState(detail);
    };
    window.addEventListener('pdfquick:consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('pdfquick:consent-updated', handleConsentUpdate);
  }, []);

  const handleRejectAll = () => {
    const next = saveConsentPreference({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    setConsentState(next);
    setSavedNotice('All optional ad & analytics storage signals set to Denied.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleAcceptEssential = () => {
    const next = saveConsentPreference({
      ad_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    setConsentState(next);
    setSavedNotice('Consent Mode v2 updated (Non-personalized ad storage granted; personalization denied).');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleResetDefault = () => {
    const next = resetConsentPreference();
    setConsentState(next);
    setSavedNotice('Reset to default privacy-first Denied state.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleOpenExternalCmp = () => {
    const opened = openCmpPreferences();
    if (!opened) {
      setSavedNotice(
        'External Google-certified CMP banner is currently inactive (AdSense is disabled). Local Consent Mode controls remain active below.'
      );
      setTimeout(() => setSavedNotice(null), 4000);
    }
  };

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/privacy#webpage`,
        name: 'Privacy Policy – Client-Side Data Protection | PDFQuick',
        url: `${baseUrl}/privacy`,
        description:
          'Comprehensive privacy policy for PDFQuick. Learn how documents remain on your device, how browser memory is handled, and our EEA/UK consent controls.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-white pb-16">
      <SeoMeta
        title="Privacy Policy – Client-Side Data Protection | PDFQuick"
        description="Comprehensive privacy policy for PDFQuick. Learn how documents remain on your device, how browser memory is handled, and our EEA/UK consent controls."
        path="/privacy"
        schema={schema}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

        <div className="py-8 sm:py-10 border-b border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy-First Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            Effective Date: {operator.effectiveDate} · Plain Language Privacy &amp; EEA/UK Consent Disclosures
          </p>
        </div>

        <div className="prose prose-slate max-w-none py-8 space-y-8 text-sm text-slate-700 leading-relaxed">
          {/* Executive Summary Card */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl not-prose">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-600" />
              Summary of Our Privacy Commitments
            </h2>
            <ul className="text-xs space-y-2 text-slate-600">
              <li>
                • <strong>No Document Uploads:</strong> When you use Merge, Split, Compress, OCR, Redaction, Unlock, or conversion tools, files load directly into your browser&apos;s local sandbox memory. They are never transmitted across the network to our servers.
              </li>
              <li>
                • <strong>No Accounts Required:</strong> You do not need to register, provide an email address, or create a profile to use PDFQuick.
              </li>
              <li>
                • <strong>No Tracking of Document Content:</strong> We cannot inspect, log, or read your document text, images, filenames, bank statements, or metadata.
              </li>
            </ul>
          </div>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              1. How Local Document Processing Works
            </h2>
            <p>
              Unlike traditional cloud-based PDF web services that upload your documents to backend servers, PDFQuick is engineered as a client-side web application.
            </p>
            <p className="mt-2">
              Using the HTML5 File API, HTML5 Canvas, and local WebAssembly/JavaScript libraries (pdf-lib, PDF.js, JSZip, and Tesseract.js), all PDF parsing, OCR text recognition, financial form filling, true redaction, and document compression happen locally on your computer, tablet, or smartphone. When processing finishes, output files download directly from browser memory via local <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">blob:</code> URLs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              2. Memory Management, Offline PWA Cache &amp; Resource Disposal
            </h2>
            <p>When a document is loaded:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Temporary binary buffers reside exclusively in your web browser&apos;s volatile RAM allocated to that tab.</li>
              <li>Generated download URLs are revoked via <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">URL.revokeObjectURL()</code> once complete.</li>
              <li>Closing or refreshing the browser tab purges allocated document buffers from RAM.</li>
              <li>PDFQuick&apos;s Service Worker caches only static application code, PDF worker scripts, fonts, and optional OCR language packs for offline capability—never user-selected PDF files.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              3. Important User Security Guidance (Shared &amp; Public Devices)
            </h2>
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-lg not-prose text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">
                Do not process sensitive documents on untrusted or public devices:
              </p>
              <p>
                While PDFQuick does not transmit your files over the Internet, your browser still writes downloaded output to your device&apos;s Downloads folder. On a shared or public computer, always use a Private/Incognito window and delete downloaded files before signing out.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              4. Cookies, Local Storage &amp; Privacy Tracking
            </h2>
            <p>
              PDFQuick does not use third-party behavioral advertising cookies, fingerprinting scripts, or cross-site tracking pixels.
            </p>
            <p className="mt-2">
              Strictly local preferences—your selected UI language (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">pdfquick_lang</code>), optional opt-in operation counters (disabled by default in the Banking &amp; Finance Hub), and your Consent Mode preference (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">pdfquick_consent_v1</code>)—stay solely inside your browser&apos;s localStorage.
            </p>
            <p className="mt-2">
              Standard web hosting logs (such as HTTP request IP addresses and user-agent strings) may be recorded by infrastructure providers strictly for reliability, security headers, and DDoS mitigation. These logs never contain document contents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              5. Advertising Disclosures
            </h2>
            <p>
              {adsense.isConfigured
                ? 'To keep PDFQuick free, clearly labeled Google AdSense units may be displayed below instructional guides, strictly separated from file upload and download controls and governed by your consent preferences.'
                : 'PDFQuick currently operates in ad-free mode with zero active advertising scripts or unverified ad placeholders. Should the operator enable Google AdSense after review, ads will remain separated from document controls and gated behind EEA/UK user consent.'}
            </p>
          </section>

          <section id="consent-settings" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              6. European Economic Area (EEA) &amp; UK User Consent (CMP &amp; Consent Mode v2)
            </h2>
            <p>
              In accordance with Google&apos;s EU User Consent Policy, GDPR, and the ePrivacy Directive, PDFQuick implements Google Consent Mode v2 privacy-first defaults: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">ad_storage</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">ad_user_data</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">ad_personalization</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">analytics_storage</code> default to <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">denied</code> for EEA, UK, and Swiss visitors until explicit consent is granted through a Google-certified Consent Management Platform (CMP) compliant with IAB TCF v2.2.
            </p>

            {/* Interactive Privacy & Consent Preferences Panel */}
            <div className="not-prose mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Privacy &amp; Consent Settings (Google Consent Mode v2)
                  </h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {cmpStatus.hasGoogleFundingChoices || cmpStatus.hasLiveTcfApi
                    ? 'Certified CMP Active'
                    : adsense.isConfigured
                      ? 'Consent Mode Active'
                      : 'Standby · Zero Trackers Loaded'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-slate-500 text-[11px]">ad_storage</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{consentState.ad_storage}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-slate-500 text-[11px]">ad_user_data</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{consentState.ad_user_data}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-slate-500 text-[11px]">ad_personalization</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{consentState.ad_personalization}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="text-slate-500 text-[11px]">analytics_storage</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{consentState.analytics_storage}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Deny All Ad &amp; Analytics Storage
                </button>
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Allow Non-Personalized Ads Only
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  onClick={handleOpenExternalCmp}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Open Certified CMP Banner
                </button>
              </div>

              {savedNotice && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{savedNotice}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Google-certified CMP readiness: supports Google Funding Choices (<code className="bg-slate-100 px-1 rounded">window.googlefc</code>) and any IAB TCF v2.2 (<code className="bg-slate-100 px-1 rounded">window.__tcfapi</code>) provider configured via <code className="bg-slate-100 px-1 rounded">VITE_CMP_PROVIDER</code> / <code className="bg-slate-100 px-1 rounded">VITE_CMP_SCRIPT_URL</code>. No external CMP or ad script is loaded until activated by the site owner.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              7. Contacting Us Regarding Privacy
            </h2>
            {operator.privacyEmail ? (
              <p>
                For privacy inquiries, data protection questions, or EEA/UK consent requests, email{' '}
                <a href={`mailto:${operator.privacyEmail}`} className="text-blue-600 underline font-medium">
                  {operator.privacyEmail}
                </a>{' '}
                {operator.legalName ? `(${operator.legalName}) ` : ''}
                or review troubleshooting guidance on our{' '}
                <Link to="/contact" className="text-blue-600 underline">
                  Contact &amp; Support page
                </Link>.
              </p>
            ) : (
              <p>
                The operator&apos;s verified privacy contact email is awaiting owner configuration prior to commercial launch. Current operator contact status and guidance are published on our{' '}
                <Link to="/contact" className="text-blue-600 underline">
                  Contact &amp; Support page
                </Link>.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
