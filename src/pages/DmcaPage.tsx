import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { getSiteConfig } from '../lib/siteConfig';

export const DmcaPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
  const { operator } = getSiteConfig();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/dmca#webpage`,
        name: 'Copyright & DMCA Policy – Intellectual Property | PDFQuick',
        url: `${baseUrl}/dmca`,
        description:
          'Copyright and intellectual property information for PDFQuick. Learn about our client-side processing model and how to submit intellectual property notices.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Copyright & DMCA Policy', path: '/dmca' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] pb-16">
      <SeoMeta
        title="Copyright & DMCA Policy – Intellectual Property | PDFQuick"
        description="Copyright and intellectual property information for PDFQuick. Learn about our client-side processing model and how to submit intellectual property notices."
        path="/dmca"
        schema={schema}
      />

      {/* Editorial Header Band */}
      <div className="bg-pq-hero border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
          <Breadcrumbs items={[{ label: 'Copyright & DMCA Policy' }]} />

          <div className="pt-5 text-start">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Copyright &amp; Intellectual Property Notice
            </h1>
            <p className="text-xs text-[#64748B] font-mono">
              Effective Date: {operator.effectiveDate} · Intellectual Property Policy · In-Browser Document Processing
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-start">
        <div className="pq-card p-6 sm:p-10 space-y-7 text-sm text-[#64748B] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#102A56] mb-2">
              1. Local Processing Architecture &amp; Document Ownership
            </h2>
            <p>
              PDFQuick operates exclusively as a client-side web utility. When you merge, split, compress, or convert documents, all processing occurs within your browser&apos;s local sandbox memory using client-side JavaScript and HTML5 Canvas.
            </p>
            <p className="mt-2">
              <strong className="text-[#17243A]">
                Your files are never transmitted to, uploaded to, hosted on, or stored on our servers.
              </strong>{' '}
              Consequently, PDFQuick does not possess, catalog, publish, or publicly distribute any documents processed by users. You retain full and exclusive copyright and ownership over your documents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#102A56] mb-2">
              2. User Responsibility for Copyrighted Materials
            </h2>
            <p>
              Users are solely responsible for ensuring they possess the legal rights, permissions, or licenses to manipulate, convert, or extract pages from documents they choose to process. PDFQuick prohibits using its utilities in any manner that infringes third-party intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#102A56] mb-2">
              3. Website Content Copyright Inquiries
            </h2>
            <p>
              If you are a copyright owner or an authorized representative who believes that any material authored and published directly on the PDFQuick website itself (such as instructional text, custom graphics, or site copy) infringes upon your copyright, you may submit a detailed written notice to the site operator.
            </p>
            <div className="mt-4 p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-xs text-[#17243A] space-y-2">
              <p>
                <strong className="text-[#102A56]">Copyright &amp; Takedown Contact:</strong>
              </p>
              {operator.dmcaEmail ? (
                <p>
                  Submit copyright notices directly to{' '}
                  <a
                    href={`mailto:${operator.dmcaEmail}`}
                    className="text-[#2563EB] underline font-semibold"
                  >
                    {operator.dmcaEmail}
                  </a>
                  {operator.legalName ? ` (Attn: ${operator.legalName})` : ''}.
                  {operator.address ? ` Postal address: ${operator.address}.` : ''}
                </p>
              ) : (
                <p>
                  Direct copyright notice email details are awaiting owner confirmation prior to commercial launch. Current operator contact status and guidance are published on our{' '}
                  <Link to="/contact" className="text-[#2563EB] underline font-semibold">
                    Contact &amp; Support page
                  </Link>
                  .
                </p>
              )}
              <p className="text-[#64748B] text-[11px]">
                Please note: Because user documents never touch our infrastructure, we cannot inspect, access, delete, or remove files that reside solely on individual users&apos; local personal devices.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#102A56] mb-2">
              4. Required Notice Details for Site Content Claims
            </h2>
            <p>
              For any notice concerning website instructional content or site assets, please provide:
            </p>
            <ul className="list-disc ps-5 space-y-1.5 mt-2">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the specific web page URL on PDFQuick where the material appears.</li>
              <li>Sufficient contact information (name, valid email address) so we may respond.</li>
              <li>
                A clear statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                A statement made under penalty of perjury that the information provided in the notification is accurate.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
