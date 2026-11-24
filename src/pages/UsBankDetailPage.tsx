import React, { useEffect } from 'react';
import { Landmark, ShieldCheck, ArrowRight, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { US_BANK_GUIDES, getUsBankGuideBySlug } from '../lib/bankingCatalog';
import { injectFaqSchema } from '../lib/faqSchema';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { UsBankSlug } from '../types';

interface UsBankDetailPageProps {
  bankSlug: UsBankSlug;
}

export const UsBankDetailPage: React.FC<UsBankDetailPageProps> = ({ bankSlug }) => {
  const guide = getUsBankGuideBySlug(bankSlug) || US_BANK_GUIDES[0];

  useEffect(() => {
    return injectFaqSchema(guide.faqs, {
      toolId: `us-bank-${guide.slug}`,
      pageUrl: `${getProductionBaseUrl()}${guide.path}`,
    });
  }, [guide]);

  const otherBanks = US_BANK_GUIDES.filter((b) => b.slug !== guide.slug);

  const baseUrl = getProductionBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}${guide.path}#webpage`,
        name: guide.metaTitle,
        url: `${baseUrl}${guide.path}`,
        description: guide.metaDescription,
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Banking & Finance', path: '/banking-finance' },
          { name: 'US Banks', path: '/banking/us-banks' },
          { name: guide.bankName, path: guide.path },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-slate-50/60 pb-16">
      <SeoMeta
        title={guide.metaTitle}
        description={guide.metaDescription}
        path={guide.path}
        schema={schema}
        faqs={guide.faqs}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: 'Banking & Finance', href: '/banking-finance' },
            { label: 'US Banks', href: '/banking/us-banks' },
            { label: guide.bankName },
          ]}
        />

        {/* Header */}
        <section className="py-8 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-md text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Client-Side Workflow · Independent Guide</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {guide.headline}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {guide.overview}
          </p>
        </section>

        {/* Independent Legal Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-8 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">{guide.legalEntityNote}</p>
        </div>

        {/* Common Tasks */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Common {guide.bankName} Statement PDF Tasks
            </h2>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            {guide.commonStatementTasks.map((task, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Recommended Active Tools */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Recommended In-Browser Tools for {guide.bankName} PDFs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {guide.recommendedWorkflows.map((wf, idx) => (
              <Link
                key={idx}
                to={wf.toolPath}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-5 shadow-xs hover:shadow transition-all flex flex-col justify-between group"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 mb-2">
                    {wf.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {wf.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <span>{wf.toolLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Ad Buffer */}
        <div className="my-10 py-2 px-2 sm:px-10">
          <AdPlaceholder />
        </div>

        {/* Viewer Permission / Locked Statement Guidance */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
            Handling Permission-Locked {guide.bankName} PDFs Safely
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {guide.viewerUnlockTip}
          </p>
        </section>

        {/* FAQs */}
        <section id="faqs" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {guide.bankName} Statement PDF FAQs
            </h2>
          </div>
          <div className="space-y-4">
            {guide.faqs.map((faq, idx) => (
              <div key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{faq.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Other US Banks Navigation */}
        <section className="my-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            Other US Bank Statement Guides
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {otherBanks.map((b) => (
              <Link
                key={b.slug}
                to={b.path}
                className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-800 hover:text-blue-600 flex items-center justify-between"
              >
                <span>{b.bankName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
