import React, { useEffect } from 'react';
import { Landmark, ShieldCheck, ArrowRight, HelpCircle, Info } from 'lucide-react';
import { US_BANK_GUIDES } from '../lib/bankingCatalog';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { SeoMeta, getProductionBaseUrl } from '../components/SeoMeta';
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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'US Bank Statement PDF Guides – PDFQuick',
    url: `${getProductionBaseUrl()}/banking/us-banks`,
    description:
      'Independent workflows for merging, splitting, rotating, and compressing PDF statements downloaded from major US banks privately in your browser.',
  };

  return (
    <div className="flex-1 bg-slate-50/60 pb-16">
      <SeoMeta
        title="US Bank Statement PDF Guides – Chase, BofA, Wells Fargo, Citi, U.S. Bank | PDFQuick"
        description="Independent privacy-first guides for organizing PDF statements downloaded from Chase, Bank of America, Wells Fargo, Citi, and U.S. Bank locally in your browser."
        path="/banking/us-banks"
        schema={schema}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: 'Banking & Finance', href: '/banking-finance' },
            { label: 'US Bank Statement Guides' },
          ]}
        />

        <div className="text-center py-8 sm:py-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200/70 rounded-md text-xs font-medium mb-4">
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
            <span>Independent Customer Workflow Guides · Zero Bank Affiliation</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            US Bank Statement PDF Guides
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Practical instructions for organizing downloaded monthly statements, check copies, and tax summaries from major US institutions—100% locally in browser memory.
          </p>
        </div>

        {/* Trademark & Independence Disclaimer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-10 flex items-start gap-3 shadow-xs">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Non-Affiliation Notice:</strong> JPMorgan Chase, Bank of America, Wells Fargo, Citibank, and U.S. Bank are trademarks of their respective owners. PDFQuick uses no bank logos, claims zero partnership or endorsement, and never accesses external banking portals or credentials.
          </p>
        </div>

        {/* 5 Bank Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {US_BANK_GUIDES.map((bank) => (
            <Link
              key={bank.slug}
              to={bank.path}
              className="bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-6 shadow-xs hover:shadow transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {bank.bankName} PDF Guide
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {bank.overview}
                </p>
                <ul className="space-y-1.5 text-xs text-slate-500 mb-4">
                  {bank.commonStatementTasks.slice(0, 2).map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
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
        <section id="faqs" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {US_BANKS_INDEX_FAQS.map((faq, idx) => (
              <div key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{faq.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
