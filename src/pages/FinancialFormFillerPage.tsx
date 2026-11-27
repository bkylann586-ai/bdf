import React, { useEffect } from 'react';
import { ShieldCheck, BookOpen, Cpu, HelpCircle } from 'lucide-react';
import { FinancialFormFillerTool } from '../components/tools/FinancialFormFillerTool';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { ToolIcon } from '../components/illustrations/PdfIllustrations';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';
import { useTranslation } from '../lib/i18n';

const FORM_FILLER_FAQS: FaqSchemaItem[] = [
  {
    question: 'Are the 5 Financial Form Filler templates official bank or government forms?',
    answer: 'No. Personal Financial Information, Income and Expense Statement, Monthly Budget, Business Financial Information, and Beneficiary Information are personal preparation helper worksheets only—never official forms issued by any bank, mortgage lender, or government agency.',
  },
  {
    question: 'Do any numbers or personal details I enter leave my browser?',
    answer: 'Never. Entered values remain strictly inside volatile React state in browser RAM, are never written to localStorage or remote databases, and clear immediately when you reset or close the tab.',
  },
  {
    question: 'Which paper sizes and currency formats are supported?',
    answer: 'You can export clean print-ready PDFs formatted for US Letter (8.5 x 11 inches) or international ISO A4 (210 x 297 mm), with USD totals automatically calculated across assets, liabilities, cash flow, budgets, and beneficiary splits.',
  },
  {
    question: 'Can I preview and edit my filled worksheet before downloading the PDF?',
    answer: 'Yes. You see live layout updates while typing, can generate a rendered pixel preview of every output PDF page inside the browser, keep editing any field, or print directly.',
  },
  {
    question: 'Why are SSNs, card numbers, and bank passwords excluded?',
    answer: 'PDFQuick follows strict financial data minimization: templates intentionally exclude SSNs, PINs, card numbers, and bank logins and actively warn if SSN or payment-card patterns are entered.',
  },
];

export const FinancialFormFillerPage: React.FC = () => {
  const { t } = useTranslation();
  const baseUrl = getProductionBaseUrl();
  const canonicalUrl = `${baseUrl}/banking/financial-pdf-form-filler`;

  useEffect(() => {
    return injectFaqSchema(FORM_FILLER_FAQS, {
      toolId: 'financial-pdf-form-filler',
      pageUrl: canonicalUrl,
    });
  }, [canonicalUrl]);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#webapp`,
        name: 'Financial PDF Form Filler – PDFQuick',
        url: canonicalUrl,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All web browsers',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description:
          'Create and fill 5 structured USD financial helper worksheets (Personal Financial, Income & Expense, Monthly Budget, Business Financial, Beneficiary) locally in browser memory and export print-ready US Letter or A4 PDFs.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Banking & Finance', path: '/banking-finance' },
          { name: 'Financial PDF Form Filler', path: '/banking/financial-pdf-form-filler' },
        ],
        baseUrl
      ),
      {
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        name: 'How to Prepare & Export Financial Helper PDFs',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Select Worksheet & Paper Size',
            text: 'Pick one of the 5 structured USD templates and select US Letter (8.5 × 11 in) or ISO A4 print framing.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Fill & Verify Computed Totals',
            text: 'Enter dollar figures, dates, and text while viewing real-time USD net worth, cash flow, or allocation totals.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Preview & Export Clean PDF',
            text: 'Generate and inspect the actual rendered PDF pages right in your browser, tweak any value, then download or print.',
          },
        ],
      },
    ],
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] pb-16">
      <SeoMeta
        title="Financial PDF Form Filler – US Letter & A4 USD Worksheets | PDFQuick"
        description="Fill Personal Financial Information, Income & Expense Statement, Monthly Budget, Business Financial, and Beneficiary helper PDFs privately in your browser. Supports US Letter, A4, and USD calculations."
        path="/banking/financial-pdf-form-filler"
        schema={schema}
        faqs={FORM_FILLER_FAQS}
      />

      {/* Architectural Header Band matching ToolLayout */}
      <div className="bg-pq-hero border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
          <Breadcrumbs
            items={[
              { label: t('nav.bankingFinance'), href: '/banking-finance' },
              { label: t('banking.formFillerTitle') },
            ]}
          />

          <div className="text-center pt-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3.5">
              <ToolIcon name="FormFiller" size="xl" />
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{t('header.privacyBadge')}</span>
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-3">
              {t('banking.formFillerTitle')}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Prepare print-ready US Letter or ISO A4 helper financial worksheets in USD directly inside your browser—with live summary math, visual PDF page preview, and zero server storage.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-start">
        {/* Interactive Form Filler Tool Container */}
        <div className="mb-12">
          <FinancialFormFillerTool />
        </div>

        {/* How To Use */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              How to Prepare &amp; Export Financial Helper PDFs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#64748B] leading-relaxed">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold font-mono tabular-nums mb-3">
                1
              </span>
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Select Worksheet &amp; Paper Size</h3>
              <p>Pick one of the 5 structured USD templates and select US Letter (8.5 × 11 in) or ISO A4 print framing.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center text-xs font-bold font-mono tabular-nums mb-3">
                2
              </span>
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Fill &amp; Verify Computed Totals</h3>
              <p>Enter dollar figures, dates, and text while viewing real-time USD net worth, cash flow, or allocation totals.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-7 h-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center text-xs font-bold font-mono tabular-nums mb-3">
                3
              </span>
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">Preview &amp; Export Clean PDF</h3>
              <p>Generate and inspect the actual rendered PDF pages right in your browser, tweak any value, then download or print.</p>
            </div>
          </div>
        </section>

        {/* Ad Buffer (>= 40px vertical & horizontal clearance) */}
        <div className="max-w-4xl mx-auto px-2 sm:px-10">
          <AdPlaceholder placement="tool-below-workspace" />
        </div>

        {/* Technical Details */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#102A56] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              In-Browser PDF Synthesis &amp; Data Boundaries
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#64748B] leading-relaxed">
            <div className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <h3 className="font-bold text-[#17243A] mb-1">Native Vector PDF Typography (English &amp; Arabic)</h3>
              <p>Pages are synthesized natively with pdf-lib and embedded Noto Sans + Noto Sans Arabic TTF fonts, supporting crisp RTL Arabic shaping, English text, and USD amounts across Mac, Windows, and mobile readers.</p>
            </div>
            <div className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <h3 className="font-bold text-[#17243A] mb-1">Volatile Memory Guarantee</h3>
              <p>Zero form inputs are persisted to localStorage, IndexedDB, cookies, or analytics logs. Resetting or closing the tab clears everything immediately.</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-4 text-xs font-semibold">
            <Link to="/merge-pdf" className="text-[#2563EB] hover:underline">
              Combine Worksheet with Bank Statements (Merge PDF) →
            </Link>
            <Link to="/banking/financial-document-privacy" className="text-[#2563EB] hover:underline">
              Redact &amp; Scrub PDFs Before Sending →
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FORM_FILLER_FAQS.map((faq, idx) => (
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
