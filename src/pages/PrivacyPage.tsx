import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, EyeOff, HardDrive } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';

export const PrivacyPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/privacy#webpage`,
        name: 'Privacy Policy – Client-Side Data Protection | PDFQuick',
        url: `${baseUrl}/privacy`,
        description:
          'Comprehensive privacy policy for PDFQuick. Learn how documents remain on your device, how browser memory is handled, and our zero-upload commitment.',
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
        description="Comprehensive privacy policy for PDFQuick. Learn how documents remain on your device, how browser memory is handled, and our zero-upload commitment."
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
            Effective Date: October 2026 · Plain Language Privacy Disclosures
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
              <li>• <strong>No Document Uploads:</strong> When you use Merge, Split, Compress, Images to PDF, or PDF to Images, files are loaded directly into your browser's local sandbox memory. They are never transmitted across the network to our servers.</li>
              <li>• <strong>No Accounts Required:</strong> You do not need to register, provide an email address, or create a profile to use PDFQuick.</li>
              <li>• <strong>No Tracking of Document Content:</strong> We cannot see your document text, images, filenames, or metadata.</li>
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
              Using the HTML5 File API, HTML5 Canvas, and local JavaScript libraries (such as pdf-lib and PDF.js), all PDF parsing, page extraction, image rendering, and document compression happen locally on your computer, tablet, or smartphone. When processing finishes, output files are downloaded directly from browser memory via generated <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">blob:</code> URLs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              2. Memory Management & Resource Disposal
            </h2>
            <p>
              When a document is loaded:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Temporary binary buffers reside in your web browser's RAM allocated specifically to that browser tab.</li>
              <li>Generated download URLs are revoked using standard <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">URL.revokeObjectURL()</code> methods after download or when a new operation is started.</li>
              <li>Closing or refreshing the browser tab immediately purges all allocated document buffers from RAM.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              3. Important User Security Guidance (Shared & Public Devices)
            </h2>
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-lg not-prose text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">
                Do not process sensitive documents on untrusted or public devices:
              </p>
              <p>
                While PDFQuick does not transmit your files over the Internet, your browser still accesses local storage when downloading files. If you are using a shared computer (such as in an internet cafe, school computer lab, public library, or kiosk):
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Others with physical or administrator access to that machine might view downloaded files in the browser's "Downloads" folder.</li>
                <li>Malicious browser extensions installed on that computer could inspect webpage DOM contents.</li>
                <li>Always use a Private/Incognito window and delete downloaded documents before logging out of shared workstations.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              4. Cookies, Analytics & Privacy Tracking
            </h2>
            <p>
              PDFQuick does not use invasive tracking cookies, cross-site trackers, or third-party behavioral advertising profilers.
            </p>
            <p className="mt-2">
              PDFQuick also provides strictly optional, opt-in local operation counters stored only inside your browser&rsquo;s <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">localStorage</code> (disabled by default). Even when enabled, only anonymous aggregate tool counts and relative route paths are kept—never PDF files, file names, bank accounts, or financial amounts. You can toggle or clear local counters anytime from the Banking &amp; Finance Hub or browser settings.
            </p>
            <p className="mt-2">
              Standard web hosting logs (such as HTTP request IP addresses and user-agent strings) may be recorded by web hosting servers solely for infrastructure maintenance, DDoS mitigation, and network diagnostics. These logs do not contain any document content or file data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              5. Advertising Disclosures
            </h2>
            <p>
              To keep PDFQuick free and available to users worldwide, we may present clearly labeled, non-intrusive sponsorships and advertising slots. Any advertising partners are strictly prohibited from accessing, intercepting, or indexing files processed within the browser canvas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              6. European Economic Area (EEA) & UK User Consent Disclosures
            </h2>
            <p>
              PDFQuick currently operates in a tracker-free posture: no third-party advertising cookies or behavioral profiling pixels are embedded in the application.
            </p>
            <p className="mt-2">
              In accordance with Google's EU User Consent Policy, the EU General Data Protection Regulation (GDPR), and the ePrivacy Directive, if and when commercial Google AdSense advertisements are deployed, website operators must collect informed user consent for the use of cookies and advertising personalization from visitors residing in the European Economic Area (EEA) and the United Kingdom (UK).
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Site Operator Requirement: Before enabling live Google AdSense ad units for European and British visitors, the production operator must configure a Google-certified Consent Management Platform (CMP) compliant with the IAB Europe Transparency and Consent Framework (TCF v2.2), such as Google Funding Choices or an equivalent certified CMP provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              7. Contacting Us Regarding Privacy
            </h2>
            <p>
              If you have any questions or inquiries regarding our privacy posture or technical architecture, you can contact the maintenance team via our <Link to="/contact" className="text-blue-600 underline">Contact & Support page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
