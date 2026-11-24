import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { FINANCIAL_TEMPLATES, HELPER_TEMPLATE_DISCLAIMER } from '../lib/financialTemplates';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { SeoMeta, getProductionBaseUrl } from '../components/SeoMeta';
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

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Fillable Financial Form Templates Structure – PDFQuick',
    url: `${getProductionBaseUrl()}/banking/financial-templates`,
    description:
      'Structured schemas for Personal Financial Information, Income & Expense Statement, Monthly Budget, Business Financial Information, and Beneficiary Information helper worksheets.',
  };

  return (
    <div className="flex-1 bg-slate-50/60 pb-16">
      <SeoMeta
        title="Financial Worksheet Schemas & Fillable Templates Structure | PDFQuick"
        description="Explore the 5 structured financial helper schemas (Personal Financial, Income & Expense, Monthly Budget, Business Financial, Beneficiary) powered by our offline US Letter & A4 PDF Form Filler."
        path="/banking/financial-templates"
        schema={schema}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: 'Banking & Finance', href: '/banking-finance' },
            { label: 'Financial Helper Templates' },
          ]}
        />

        <div className="text-center py-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive US Letter &amp; A4 Form Filler Now Live</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Structured Financial Form Templates
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Explore the field architecture for all 5 personal and small-business helper worksheets designed around US Letter standards and strict PII minimization.
          </p>
        </div>

        {/* Non-Official Form Legal Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex items-start gap-3">
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
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-100' : 'text-blue-600'}`} />
                    <span className="text-sm font-bold">{tpl.name}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {tpl.sections.length} sections ·{' '}
                    {tpl.sections.reduce((acc, s) => acc + s.fields.length, 0)} fields
                  </p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{activeTemplate.name}</h2>
                <p className="text-xs sm:text-sm text-slate-600">{activeTemplate.shortSummary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-mono">
                  {activeTemplate.paperStandard}
                </span>
                <Link
                  to={`/banking/financial-pdf-form-filler?template=${activeTemplate.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Fill &amp; Export PDF</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              {activeTemplate.sections.map((section) => (
                <div key={section.id} className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{section.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{section.description}</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-3 font-semibold">Field Label</th>
                          <th className="py-2 pr-3 font-semibold">Type</th>
                          <th className="py-2 pr-3 font-semibold">Rule</th>
                          <th className="py-2 font-semibold">Example Format</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 text-slate-700">
                        {section.fields.map((field) => (
                          <tr key={field.key}>
                            <td className="py-2.5 pr-3 font-medium">
                              {field.label}
                              {field.sensitivity === 'pii-caution' && (
                                <span className="ml-1.5 text-[10px] text-amber-700 font-normal">
                                  (Local-only)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 font-mono text-[11px] text-blue-700">
                              {field.type}
                            </td>
                            <td className="py-2.5 pr-3 text-[11px]">
                              {field.required ? 'Required' : 'Optional'}
                            </td>
                            <td className="py-2.5 text-[11px] text-slate-500 font-mono">
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
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Pair prepared worksheets with active tools:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {activeTemplate.recommendedCompanionTools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <span>{tool.label}</span>
                    <ArrowRight className="w-3 h-3" />
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
        <section id="faqs" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {FINANCIAL_TEMPLATES_FAQS.map((faq, idx) => (
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
