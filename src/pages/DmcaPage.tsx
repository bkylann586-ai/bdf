import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';

export const DmcaPage: React.FC = () => {
  const baseUrl = getProductionBaseUrl();
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
    <div className="flex-1 bg-white pb-16">
      <SeoMeta
        title="Copyright & DMCA Policy – Intellectual Property | PDFQuick"
        description="Copyright and intellectual property information for PDFQuick. Learn about our client-side processing model and how to submit intellectual property notices."
        path="/dmca"
        schema={schema}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Copyright & DMCA Policy' }]} />

        <div className="py-8 sm:py-10 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Copyright & Intellectual Property Notice
          </h1>
          <p className="text-xs text-slate-500">
            Intellectual Property Policy · In-Browser Document Processing
          </p>
        </div>

        <div className="prose prose-slate max-w-none py-8 space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Local Processing Architecture & Document Ownership</h2>
            <p>
              PDFQuick operates exclusively as a client-side web utility. When you merge, split, compress, or convert documents, all processing occurs within your browser's local sandbox memory using client-side JavaScript and HTML5 Canvas.
            </p>
            <p className="mt-2">
              <strong>Your files are never transmitted to, uploaded to, hosted on, or stored on our servers.</strong> Consequently, PDFQuick does not possess, catalog, publish, or publicly distribute any documents processed by users. You retain full and exclusive copyright and ownership over your documents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. User Responsibility for Copyrighted Materials</h2>
            <p>
              Users are solely responsible for ensuring they possess the legal rights, permissions, or licenses to manipulate, convert, or extract pages from documents they choose to process. PDFQuick prohibits using its utilities in any manner that infringes third-party intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Website Content Copyright Inquiries</h2>
            <p>
              This website does not maintain a registered designated copyright agent with the U.S. Copyright Office. If you are a copyright owner or an authorized agent who believes that any material authored and published directly on the PDFQuick website itself (such as instructional text, custom graphics, or site copy) infringes upon your copyright, you may submit a detailed inquiry to the site administrators.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg not-prose text-xs text-slate-700 space-y-2">
              <p><strong>How to submit an inquiry:</strong></p>
              <p>
                Direct contact details are pending configuration by the website owner prior to public release. Current contact status and guidance are available on our <Link to="/contact" className="text-blue-600 underline font-medium">Contact &amp; Support page</Link>.
              </p>
              <p className="text-slate-500 text-[11px]">
                Please note: Because user documents never touch our infrastructure, we cannot inspect, access, delete, or remove files that reside solely on individual users' local personal devices.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Required Notice Details for Site Content Claims</h2>
            <p>
              For any notice concerning website instructional content or site assets, please provide:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the specific web page URL on PDFQuick where the material appears.</li>
              <li>Sufficient contact information (name, valid email address) so we may respond.</li>
              <li>A clear statement that you have a good-faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement made under penalty of perjury that the information provided in the notification is accurate.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
