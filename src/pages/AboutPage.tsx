import React from 'react';
import { ShieldCheck, Cpu, Code2, Lock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';

export const AboutPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
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
            PDFQuick was built with a clear technical conviction: basic PDF operations should happen on the user's machine, not on a remote server.
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
              Modern web browsers are capable execution environments. Leveraging HTML5 Canvas and standard-compliant JavaScript libraries (including pdf-lib and PDF.js), PDFQuick compiles and manipulates documents directly within your computer or smartphone's memory.
            </p>
            <p className="mt-2">
              When you drop a file onto PDFQuick:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Zero document bytes leave your machine:</strong> No API endpoints receive your document.</li>
              <li><strong>No server queues:</strong> Processing runs at your device's native hardware speed without queue wait times.</li>
              <li><strong>Automatic memory reclamation:</strong> Temporary memory buffers are cleared when operations finish or when you close the tab.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-600" />
              Open, Maintained Technologies
            </h2>
            <p>
              PDFQuick relies on established, audited open-source browser components:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 not-prose">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">pdf-lib</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Handles binary stream parsing, page tree manipulation, lossless object merging, splitting, and metadata synthesis.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">PDF.js</h3>
                <p className="text-xs text-slate-600 mt-1">
                  The standard-compliant PDF rendering engine developed by the open-source community, executing vector rasterization in Web Workers.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">JSZip</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Provides high-speed browser-side DEFLATE compression for packaging split pages and rendered page image sets into convenient ZIP downloads.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-semibold text-slate-900 text-xs">HTML5 Canvas</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Native 2D graphic rendering for sub-pixel image extraction and color space normalization.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Transparency & Business Model
            </h2>
            <p>
              PDFQuick is free to use without subscriptions, watermarks, or user account registrations. To keep infrastructure online, we reserve designated non-intrusive sponsorship slots. We do not sell user data, run invasive behavioral trackers, or use deceptive patterns.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Publisher &amp; Operator Transparency
            </h2>
            <p>
              PDFQuick is engineered around client-side data sovereignty and transparent technical disclosures. Current support guidelines and operator configuration status are documented on our <Link to="/contact" className="text-blue-600 underline">Contact &amp; Support page</Link>.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Pending Operator Details: Verified legal entity identity, registered address, and direct administrative contact email are deferred until supplied by the site owner prior to public launch or commercial ad enrollment.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-slate-200 flex items-center justify-between">
          <Link
            to="/privacy"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Read our Privacy Policy</span>
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
