import React, { useEffect } from 'react';
import { Landmark, ShieldCheck, ArrowRight, HelpCircle, Info } from 'lucide-react';
import { US_BANK_GUIDES } from '../lib/bankingCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';

const US_BANKS_INDEX_FAQS: FaqSchemaItem[] = [
  {
    question: 'Does PDFQuick integrate with Chase, Bank of America, Wells Fargo, Citi, or U.S. Bank APIs?',
    answer: 'No. PDFQuick is an independent browser PDF utility and has zero API integration, affiliation, or endorsement from any bank. You process only files downloaded directly onto your own computer.',
  },
  {
    question: 'How should mortgage applicants organize US bank statements for underwriting?',
    answer: 'Typically US lenders request 2 consecutive full monthly statement PDFs per checking or savings account including all numbered pages. Merge monthly statements chronologically with Merge PDF, compress only if above portal upload limits, and never alter transaction figures.',
  },
  {
    question: 'Why do some downloaded bank PDFs fail to open inside PDFQuick?',
    answer: 'Some bank portals apply owner permission flags or encryption dictionaries to exported statements. For security and accuracy, PDFQuick rejects encrypted PDFs and recommends exporting a fresh unlocked working copy via your own computer Print -> Save as PDF if permitted.',
  },
  {
    question: 'Can I remove blank pages from multi-page US bank statements?',
    answer: 'Yes, when permitted by a lender or when preparing internal tax binders, Delete PDF Pages lets you omit trailing marketing inserts cleanly in browser memory.',
  },
  {
    question: 'What paper size should US financial receipt bundles use?',
    answer: 'Choose US Letter (8.5 x 11 inches) inside Images to PDF when assembling check photos, branch deposit slips, or paper expense receipts for US lenders and accountants.',
  },
];

export const UsBanksIndexPage: React.FC = () => {
  useEffect(() => {
    return injectFaqSchema(US_BANKS_INDEX_FAQS, {
      toolId: 'us-banks-guides',
      pageUrl: `${getProductionBaseUrl()}/banking/us-banks`,
    });
  }, []);

  const baseUrl = getProductionBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/banking/us-banks#webpage`,
        name: 'US Bank Statement PDF Guides – PDFQuick',
        url: `${baseUrl}/banking/us-banks`,
        description:
          'Independent workflows for merging, splitting, rotating, and compressing PDF statements downloaded from major US banks privately in your browser.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Banking & Finance', path: '/banking-finance' },
          { name: 'US Bank Statement Guides', path: '/banking/us-banks' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-[#F4F7FB] pb-16">
      <SeoMeta
        title="US Bank Statement PDF Guides – Chase, BofA, Wells Fargo, Citi, U.S. Bank | PDFQuick"
        description="Independent privacy-first guides for organizing PDF statements downloaded from Chase, Bank of America, Wells Fargo, Citi, and U.S. Bank locally in your browser."
        path="/banking/us-banks"
        schema={schema}
        faqs={US_BANKS_INDEX_FAQS}
      />

      {/* Editorial Header Band */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
          <Breadcrumbs
            items={[
              { label: 'Banking & Finance', href: '/banking-finance' },
              { label: 'US Bank Statement Guides' },
            ]}
          />

          <div className="text-center pt-5 sm:pt-7 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F7FB] text-[#102A56] border border-[#E2E8F0] rounded-lg text-xs font-semibold mb-4">
              <Landmark className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Independent Customer Workflow Guides · Zero Bank Affiliation</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#102A56] tracking-tight mb-3">
              US Bank Statement PDF Guides
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Practical instructions for organizing downloaded monthly statements, check copies, and tax summaries from major US institutions—100% locally in browser memory.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Trademark & Independence Disclaimer */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-10 flex items-start gap-3 shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            <strong className="text-[#102A56]">Non-Affiliation Notice:</strong> JPMorgan Chase, Bank of America, Wells Fargo, Citibank, and U.S. Bank are trademarks of their respective owners. PDFQuick uses no bank logos, claims zero partnership or endorsement, and never accesses external banking portals or credentials.
          </p>
        </div>

        {/* 5 Bank Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {US_BANK_GUIDES.map((bank) => (
            <Link
              key={bank.slug}
              to={bank.path}
              className="bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,42,86,0.04)] hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg font-bold text-[#102A56] group-hover:text-[#2563EB] transition-colors">
                    {bank.bankName} PDF Guide
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Offline Safe</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-4">
                  {bank.overview}
                </p>
                <ul className="space-y-1.5 text-xs text-[#64748B] mb-4">
                  {bank.commonStatementTasks.slice(0, 2).map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                <span>Read {bank.bankName} Guide</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Ad Buffer */}
        <div className="my-10 py-2 px-2 sm:px-10">
          <AdPlaceholder />
        </div>

        {/* FAQs */}
        <section id="faqs" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-10 shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {US_BANKS_INDEX_FAQS.map((faq, idx) => (
              <div key={idx} className="pb-4 border-b border-[#E2E8F0] last:border-0 last:pb-0">
                <h3 className="text-sm font-bold text-[#17243A] mb-1.5">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
