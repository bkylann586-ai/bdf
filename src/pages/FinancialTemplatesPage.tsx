import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { FINANCIAL_TEMPLATES, HELPER_TEMPLATE_DISCLAIMER } from '../lib/financialTemplates';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { FinancialTemplateId } from '../types';

const FINANCIAL_TEMPLATES_FAQS: FaqSchemaItem[] = [
  {
    question: 'Are these 5 financial templates official bank or IRS forms?',
    answer: 'No. Personal Financial Information, Income and Expense Statement, Monthly Budget, Business Financial Information, and Beneficiary Information are general helper structures designed to help organize your personal figures—never official forms issued by any bank or government agency.',
  },
  {
    question: 'Can I generate a filled PDF directly from these templates?',
    answer: 'Yes. Open our interactive Financial PDF Form Filler to enter dollar amounts, dates, and notes locally in browser RAM, preview rendered pages, and export US Letter or ISO A4 print-ready PDFs.',
  },
  {
    question: 'Why are Social Security Numbers (SSNs), PINs, and bank passwords excluded from the schemas?',
    answer: 'To follow strict financial data minimization, our helper schemas intentionally omit SSNs, online banking usernames, passwords, and full account numbers so sensitive credentials are never entered into web inputs.',
  },
  {
    question: 'Do the templates format cleanly onto US Letter paper?',
    answer: 'Yes. Every template structure is designed primarily for 8.5 x 11 inch US Letter printing while keeping margins compatible with international ISO A4 sheets.',
  },
  {
    question: 'Which active tools can I use today alongside my financial worksheets?',
    answer: 'Today you can use Merge PDF to combine exported statements with worksheets, Add Page Numbers for loan binder pagination, and Watermark PDF to stamp copies CONFIDENTIAL.',
  },
];

export const FinancialTemplatesPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<FinancialTemplateId>('personal-financial-information');

  useEffect(() => {
    return injectFaqSchema(FINANCIAL_TEMPLATES_FAQS, {
      toolId: 'financial-templates',
      pageUrl: `${getProductionBaseUrl()}/banking/financial-templates`,
    });
  }, []);

  const activeTemplate =
    FINANCIAL_TEMPLATES.find((t) => t.id === selectedId) || FINANCIAL_TEMPLATES[0];

  const baseUrl = getProductionBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/banking/financial-templates#webpage`,
        name: 'Fillable Financial Form Templates Structure – PDFQuick',
        url: `${baseUrl}/banking/financial-templates`,
        description:
          'Structured schemas for Personal Financial Information, Income & Expense Statement, Monthly Budget, Business Financial Information, and Beneficiary Information helper worksheets.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Banking & Finance', path: '/banking-finance' },
          { name: 'Financial Helper Templates', path: '/banking/financial-templates' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] pb-16">
      <SeoMeta
        title="Financial Worksheet Schemas & Fillable Templates Structure | PDFQuick"
        description="Explore the 5 structured financial helper schemas (Personal Financial, Income & Expense, Monthly Budget, Business Financial, Beneficiary) powered by our offline US Letter & A4 PDF Form Filler."
        path="/banking/financial-templates"
        schema={schema}
        faqs={FINANCIAL_TEMPLATES_FAQS}
      />

      {/* Editorial Header Band */}
      <div className="bg-pq-hero border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
          <Breadcrumbs
            items={[
              { label: 'Banking & Finance', href: '/banking-finance' },
              { label: 'Financial Helper Templates' },
            ]}
          />

          <div className="text-center pt-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] mb-3">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Interactive US Letter &amp; A4 Form Filler Now Live</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-3">
              Structured Financial Form Templates
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Explore the field architecture for all 5 personal and small-business helper worksheets designed around US Letter standards and strict PII minimization.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-start">
        {/* Non-Official Form Legal Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
            {HELPER_TEMPLATE_DISCLAIMER}
          </p>
        </div>

        {/* Template Switcher + Schema Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-4 space-y-2.5">
            {FINANCIAL_TEMPLATES.map((tpl) => {
              const isSelected = tpl.id === activeTemplate.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedId(tpl.id)}
                  className={`w-full text-start p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#102A56] text-white border-[#102A56] shadow-sm'
                      : 'bg-white text-[#17243A] border-[#E2E8F0] hover:border-[#2563EB]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#38BDF8]' : 'text-[#2563EB]'
                      }`}
                    />
                    <span className="text-sm font-bold">{tpl.name}</span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-[#64748B]'
                    }`}
                  >
                    {tpl.sections.length} sections ·{' '}
                    {tpl.sections.reduce((acc, s) => acc + s.fields.length, 0)} fields
                  </p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-6 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-xl font-bold text-[#102A56] mb-1">{activeTemplate.name}</h2>
                <p className="text-xs sm:text-sm text-[#64748B]">{activeTemplate.shortSummary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F4F7FB] border border-[#E2E8F0] text-[#17243A] rounded-lg text-[11px] font-mono">
                  {activeTemplate.paperStandard}
                </span>
                <Link
                  to={`/banking/financial-pdf-form-filler?template=${activeTemplate.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  <span>Fill &amp; Export PDF</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              {activeTemplate.sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4 sm:p-5"
                >
                  <h3 className="text-sm font-bold text-[#102A56] mb-1">{section.title}</h3>
                  <p className="text-xs text-[#64748B] mb-3">{section.description}</p>

                  <div className="overflow-x-auto bg-white border border-[#E2E8F0] rounded-lg px-3">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                          <th className="py-2.5 pe-3 font-semibold text-start">Field Label</th>
                          <th className="py-2.5 pe-3 font-semibold text-start">Type</th>
                          <th className="py-2.5 pe-3 font-semibold text-start">Rule</th>
                          <th className="py-2.5 font-semibold text-start">Example Format</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#17243A]">
                        {section.fields.map((field) => (
                          <tr key={field.key}>
                            <td className="py-2.5 pe-3 font-medium">
                              {field.label}
                              {field.sensitivity === 'pii-caution' && (
                                <span className="ms-1.5 text-[10px] text-amber-700 font-normal">
                                  (Local-only)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pe-3 font-mono text-[11px] text-[#2563EB]">
                              {field.type}
                            </td>
                            <td className="py-2.5 pe-3 text-[11px]">
                              {field.required ? 'Required' : 'Optional'}
                            </td>
                            <td className="py-2.5 text-[11px] text-[#64748B] font-mono">
                              {field.examplePlaceholder}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Companion Tools */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Pair prepared worksheets with active tools:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {activeTemplate.recommendedCompanionTools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    <span>{tool.label}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
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
            {FINANCIAL_TEMPLATES_FAQS.map((faq, idx) => (
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
