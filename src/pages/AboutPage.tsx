import React from 'react';
import { Cpu, Code2, Lock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { getSiteConfig } from '../lib/siteConfig';

export const AboutPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
  const { operator, adsense } = getSiteConfig();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(baseUrl),
      {
        '@type': 'AboutPage',
        '@id': `${baseUrl}/about#webpage`,
        name: 'About PDFQuick – Client-Side Document Utilities',
        url: `${baseUrl}/about`,
        description:
          'Learn how PDFQuick processes PDF files directly in your web browser using modern WebAssembly and JavaScript, preserving document confidentiality.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'About PDFQuick', path: '/about' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-white pb-16">
      <SeoMeta
        title="About PDFQuick – Client-Side Document Utilities"
        description="Learn how PDFQuick processes PDF files directly in your web browser using modern WebAssembly and JavaScript, preserving document confidentiality."
        path="/about"
        schema={schema}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'About PDFQuick' }]} />

        <div className="py-8 sm:py-12 border-b border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium mb-3">
            <span>Our Mission</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            About PDFQuick
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            PDFQuick was built with a clear technical conviction: basic PDF and financial document operations should happen on the user&apos;s machine, not on a remote server.
          </p>
        </div>

        <div className="prose prose-slate max-w-none py-8 space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              The Problem with Traditional PDF Websites
            </h2>
            <p>
              Many online PDF converters require you to upload your files to remote cloud servers. Once uploaded, your confidential financial statements, legal contracts, tax forms, and private receipts sit on external infrastructure. Even when services advertise automatic deletion, data transit and temporary storage introduce unnecessary privacy risks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              Our Architecture: In-Browser Client-Side Execution
            </h2>
            <p>
              Modern web browsers are capable execution environments. Leveraging HTML5 Canvas, WebAssembly, and standard-compliant JavaScript libraries (including pdf-lib, PDF.js, and Tesseract.js), PDFQuick compiles and manipulates documents directly within your computer or smartphone&apos;s memory.
            </p>
            <p className="mt-2">When you drop a file onto PDFQuick:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Zero document bytes leave your machine:</strong> No API endpoints receive your document.</li>
              <li><strong>No server queues:</strong> Processing runs at your device&apos;s native hardware speed without queue wait times.</li>
              <li><strong>Automatic memory reclamation:</strong> Temporary memory buffers are cleared when operations finish or when you close the tab.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              Open, Maintained Technologies
            </h2>
            <p>PDFQuick relies on established, audited open-source browser components:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 not-prose">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">pdf-lib</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Handles binary stream parsing, page tree manipulation, lossless object merging, splitting, redaction output, and metadata synthesis.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">PDF.js</h3>
                <p className="text-xs text-slate-600 mt-1">
                  The standard-compliant PDF rendering engine executing vector rasterization cleanly inside a dedicated Web Worker.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">Tesseract.js (OCR)</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Lazy-loaded WebAssembly optical character recognition engine with local language assets cached in browser storage for offline OCR.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">JSZip &amp; HTML5 Canvas</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Sub-pixel canvas rasterization and browser-side DEFLATE packaging for multi-page image sets and split PDF ZIP downloads.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Transparency &amp; Business Model
            </h2>
            <p>
              PDFQuick is free to use without subscriptions, watermarks, or user account registrations.{' '}
              {adsense.isConfigured
                ? 'To keep the platform free, clearly labeled advertising may appear alongside instructional guides with full EEA/UK user consent controls.'
                : 'Currently, PDFQuick runs ad-free while operator disclosures and consent infrastructure are finalized. If advertising is later enabled upon owner approval, it will remain strictly separated from document dropzones and governed by regional user consent controls.'}{' '}
              We never sell user data, never upload documents, and never run invasive behavioral trackers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Publisher &amp; Operator Transparency
            </h2>
            <div className="not-prose bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-600">Legal Entity / Operator:</span>
                <span className="font-medium text-slate-900">
                  {operator.legalName || 'Pending owner confirmation prior to commercial launch'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-600">Support &amp; Administrative Email:</span>
                <span className="font-medium text-slate-900">
                  {operator.supportEmail ? (
                    <a href={`mailto:${operator.supportEmail}`} className="text-blue-600 hover:underline">
                      {operator.supportEmail}
                    </a>
                  ) : (
                    'Pending owner confirmation (see Contact & Support)'
                  )}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-semibold text-slate-600">Correspondence Address:</span>
                <span className="font-medium text-slate-900">
                  {operator.address || 'Optional / pending owner input'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Full technical troubleshooting instructions and operator contact status are maintained on our{' '}
              <Link to="/contact" className="text-blue-600 underline">
                Contact &amp; Support page
              </Link>.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/privacy"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Read our Privacy Policy &amp; Consent Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/tools"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Explore Tools →
          </Link>
        </div>
      </div>
    </div>
  );
};
