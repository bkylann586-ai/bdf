import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { getSiteConfig } from '../lib/siteConfig';

export const TermsPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
  const { operator } = getSiteConfig();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/terms#webpage`,
        name: 'Terms of Use – Legal Agreement | PDFQuick',
        url: `${baseUrl}/terms`,
        description:
          'Terms of Use and service agreement for PDFQuick online PDF utilities. Plain terms governing usage of our client-side software tools.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Terms of Use', path: '/terms' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-white pb-16">
      <SeoMeta
        title="Terms of Use – Legal Agreement | PDFQuick"
        description="Terms of Use and service agreement for PDFQuick online PDF utilities. Plain terms governing usage of our client-side software tools."
        path="/terms"
        schema={schema}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Terms of Use' }]} />

        <div className="py-8 sm:py-10 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Terms of Use
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: {operator.effectiveDate} · Governing Service Terms
          </p>
        </div>

        <div className="prose prose-slate max-w-none py-8 space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing and using PDFQuick (the &quot;Service&quot;), you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you should not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Permitted Use &amp; Software License</h2>
            <p>
              PDFQuick grants you a personal, non-exclusive, non-transferable, revocable license to access and use the client-side utilities provided on this website for lawful personal, academic, and business document processing tasks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. User Document Ownership &amp; Intellectual Property</h2>
            <p>
              You retain full, exclusive copyright and ownership over all documents, files, graphics, and data processed using PDFQuick. Because processing occurs entirely within your local browser runtime, PDFQuick does not take possession of, claim any intellectual property in, or license any rights to your files.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. User Responsibilities &amp; Acceptable Conduct</h2>
            <p>You agree not to use the Service:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>To process documents in violation of any applicable local, state, national, or international law or intellectual property rights.</li>
              <li>To attempt to circumvent, disable, or interfere with security features of the website.</li>
              <li>To distribute malicious code, viruses, or exploit payloads embedded in crafted documents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-2">
              PDFQuick does not warrant that the Service will meet your specific requirements, that document processing will be uninterrupted or error-free, or that all document formatting, form fields, and annotations will be reconstructed identically across unusual or non-standard PDF specifications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">6. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PDFQUICK, ITS DEVELOPERS, OR OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF DATA, DOCUMENT CORRUPTION, OR BUSINESS INTERRUPTION ARISING OUT OF YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Use at any time. Any changes will be posted on this page with an updated effective date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">8. Operator Transparency &amp; Governing Notices</h2>
            <div className="not-prose p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-2">
              <p>
                <strong>Operator / Legal Entity:</strong>{' '}
                {operator.legalName || 'Pending owner confirmation prior to commercial launch'}
              </p>
              <p>
                <strong>Governing Jurisdiction:</strong>{' '}
                {operator.jurisdiction || 'Pending owner confirmation prior to commercial launch'}
              </p>
              <p>
                <strong>Administrative Contact:</strong>{' '}
                {operator.supportEmail ? (
                  <a href={`mailto:${operator.supportEmail}`} className="text-blue-600 underline font-medium">
                    {operator.supportEmail}
                  </a>
                ) : (
                  <>
                    Pending owner configuration on the{' '}
                    <Link to="/contact" className="text-blue-600 underline font-medium">
                      Contact &amp; Support page
                    </Link>
                  </>
                )}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
