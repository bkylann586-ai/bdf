import React, { useEffect, useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  Search,
  X,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BANKING_SERVICES,
  US_BANK_GUIDES,
  searchBankingServices,
} from '../lib/bankingCatalog';
import { FINANCIAL_TEMPLATES } from '../lib/financialTemplates';
import {
  clearAnalyticsData,
  getAnalyticsSummary,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '../lib/analytics';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { EmptySearchIllustration } from '../components/illustrations/PdfIllustrations';
import { useTranslation } from '../lib/i18n';

const BANKING_HUB_FAQS: FaqSchemaItem[] = [
  {
    question: 'Do Banking & Finance PDF tools upload my bank statements to any server?',
    answer: 'Never. All active PDF merging, splitting, compression, rotation, page numbering, conversion, and watermarking run strictly inside your browser memory sandbox with zero server uploads.',
  },
  {
    question: 'Does PDFQuick require my Chase, Bank of America, or Wells Fargo login?',
    answer: 'No. PDFQuick never connects to bank accounts and never asks for usernames, passwords, PINs, or Open Banking tokens. You work solely with PDF files you already downloaded onto your computer.',
  },
  {
    question: 'Are Financial PDF Form Filler and Document Privacy Redaction live today?',
    answer: 'Yes. All 10 Banking & Finance workflows are active inside your browser: Services 1 through 8 link directly to our core PDF tools, Financial PDF Form Filler exports US Letter or A4 USD worksheets, and Financial Document Privacy provides destructive pixel-flattened redaction plus Metadata/XMP scrubbing.',
  },
  {
    question: 'Are the 5 financial worksheet schemas official bank forms?',
    answer: 'No. Personal Financial Information, Income and Expense Statement, Monthly Budget, Business Financial Information, and Beneficiary Information are general-purpose preparation helper schemas and are not official forms issued by any financial institution.',
  },
  {
    question: 'Can PDFQuick alter numbers, dates, or balances on a bank statement?',
    answer: 'No. PDFQuick strictly prohibits bank statement falsification or balance alteration. Our tools only perform legitimate document organization such as combining monthly PDFs, deleting blank pages, rotating scans, compressing sizes, and adding reviewer watermarks.',
  },
];

export const BankingFinanceHubPage: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'planned'>('all');
  const [optInLog, setOptInLog] = useState<boolean>(() => isAnalyticsEnabled());
  const [opCount, setOpCount] = useState<number>(() => getAnalyticsSummary().totalOperations);

  useEffect(() => {
    return injectFaqSchema(BANKING_HUB_FAQS, {
      toolId: 'banking-finance',
      pageUrl: `${getProductionBaseUrl()}/banking-finance`,
    });
  }, []);

  const matchedServices = searchBankingServices(query).filter((svc) =>
    statusFilter === 'all' ? true : svc.status === statusFilter
  );

  const handleToggleOptIn = () => {
    const next = !optInLog;
    setAnalyticsEnabled(next);
    setOptInLog(next);
    setOpCount(getAnalyticsSummary().totalOperations);
  };

  const handleClearLog = () => {
    clearAnalyticsData();
    setOpCount(0);
  };

  const baseUrl = getProductionBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/banking-finance#webpage`,
        name: 'Banking & Finance PDF Tools – PDFQuick',
        url: `${baseUrl}/banking-finance`,
        description:
          'US-first and global Banking & Finance PDF toolkit: prepare Chase, Bank of America, Wells Fargo, Citi, and U.S. Bank PDF statements locally in your browser.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Banking & Finance', path: '/banking-finance' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-[#F4F7FB] pb-16">
      <SeoMeta
        title="Banking & Finance PDF Tools – Private Statement Workflows | PDFQuick"
        description="Combine, split, compress, rotate, number, and watermark bank statements and financial PDFs locally in your browser. Zero uploads, zero bank logins."
        path="/banking-finance"
        schema={schema}
        faqs={BANKING_HUB_FAQS}
      />

      {/* Editorial Header Band */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10 sm:pb-12">
          <Breadcrumbs items={[{ label: 'Banking & Finance' }]} />

          <section className="text-center pt-5 sm:pt-7 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F7FB] text-[#102A56] border border-[#E2E8F0] rounded-lg text-xs font-semibold mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{t('banking.badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A56] tracking-tight mb-3">
              {t('banking.title')}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed mb-7">
              {t('banking.subtitle')}
            </p>

            {/* Search & Status Filter */}
            <div className="max-w-xl mx-auto space-y-3.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#64748B] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search banking tools (e.g. merger, mortgage, Chase, watermark, redaction)..."
                  aria-label="Search Banking and Finance PDF tools"
                  className="w-full ps-10 pe-10 py-2.5 min-h-[44px] text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] placeholder:text-[#64748B] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="p-1.5 text-[#64748B] hover:text-[#102A56] absolute end-2.5 top-1/2 -translate-y-1/2 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#102A56] text-white border-[#102A56]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB]/40 hover:text-[#102A56]'
                  }`}
                >
                  All Active Workflows ({BANKING_SERVICES.length})
                </button>
                <Link
                  to="/banking/financial-pdf-form-filler"
                  className="inline-flex items-center px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg border bg-[#EFF6FF] text-[#102A56] border-[#BFDBFE] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                >
                  {t('banking.formFillerTitle')} →
                </Link>
                <Link
                  to="/banking/financial-document-privacy"
                  className="inline-flex items-center px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg border bg-[#2563EB] text-white border-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
                >
                  {t('banking.privacyTitle')} →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Compliance & Integrity Guardrails Banner */}
        <section className="bg-[#102A56] text-white rounded-2xl p-6 sm:p-7 mb-10 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-3.5 relative">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div className="text-xs text-slate-200 leading-relaxed space-y-1.5">
              <p className="font-bold text-white text-sm sm:text-base">
                Strict Financial Privacy &amp; Document Integrity Standards
              </p>
              <p>
                PDFQuick executes purely inside your browser tab memory (250 MB safety limit). We never upload statements, request banking passwords, store files in{' '}
                <code className="bg-white/10 text-[#38BDF8] px-1.5 py-0.5 rounded font-mono">
                  localStorage
                </code>
                , or offer statement-altering/forgery tools. Encrypted statements are cleanly rejected until unlocked locally on your own computer.
              </p>
            </div>
          </div>
        </section>

        {/* 10 Banking & Finance Services Directory */}
        <section className="mb-14">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5 mb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#102A56]">
              10 Banking &amp; Finance PDF Workflows
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All 10 Workflows Active · 100% Client-Side
            </span>
          </div>

          {matchedServices.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
              <EmptySearchIllustration className="w-36 h-28 mx-auto mb-4" />
              <p className="text-sm font-medium text-[#17243A] mb-1">
                No banking workflows matched &ldquo;{query}&rdquo;.
              </p>
              <p className="text-xs text-[#64748B] mb-5">
                Try another financial keyword or reset filters to browse all 10 workflows.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl cursor-pointer transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchedServices.map((svc) => {
                const isActive = svc.status === 'active';
                return (
                  <div
                    key={svc.id}
                    className={`bg-white border rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,42,86,0.04)] flex flex-col justify-between transition-all ${
                      isActive
                        ? 'border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-sm'
                        : 'border-amber-200/80 bg-amber-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#102A56] text-[#38BDF8] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {svc.number}
                          </span>
                          <h3 className="text-base font-bold text-[#17243A]">
                            {svc.name}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{isActive ? t('banking.statusActive') : t('banking.statusPlanned')}</span>
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-4">
                        {svc.shortDescription}
                      </p>

                      <ul className="space-y-1.5 text-xs text-[#64748B] mb-5">
                        {svc.usUseCases.map((uc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                            <span>{uc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                      <Link
                        to={svc.primaryPath}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isActive
                            ? 'text-[#2563EB] hover:text-[#1D4ED8]'
                            : 'text-amber-800 hover:text-amber-950'
                        }`}
                      >
                        <span>{isActive ? 'Open Active Tool' : 'View Phase 2 Architecture'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {svc.secondaryLinks && svc.secondaryLinks.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {svc.secondaryLinks.map((sec) => (
                            <Link
                              key={sec.path}
                              to={sec.path}
                              className="text-[11px] font-medium text-[#64748B] hover:text-[#2563EB] underline"
                            >
                              {sec.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Ad Placeholder Buffered Properly Between Major Sections */}
        <div className="my-10 py-2 px-2 sm:px-10">
          <AdPlaceholder />
        </div>

        {/* US Bank Statement Guides Section */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-10 shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
                US Bank Statement Preparation Guides
              </h2>
            </div>
            <Link
              to="/banking/us-banks"
              className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
            >
              <span>Compare All 5 US Bank Guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-6">
            Independent workflow guides showing how customers organize monthly PDF exports from major US banks for mortgages, SBA financing, and tax filing—with zero official affiliation, zero bank logos, and zero credential access.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {US_BANK_GUIDES.map((bank) => (
              <Link
                key={bank.slug}
                to={bank.path}
                className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-white rounded-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#17243A] group-hover:text-[#2563EB] mb-1.5">
                    {bank.bankName}
                  </h3>
                  <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-3">
                    {bank.commonStatementTasks[0]}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] mt-3">
                  <span>Open guide</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Financial Helper Templates Structure Preview */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-10 shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
                5 Fillable Financial Helper Templates (Interactive PDF Export Live)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/banking/financial-pdf-form-filler"
                className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Open Form Filler Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/banking/financial-templates"
                className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
              >
                <span>Inspect Field Schemas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 mb-5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Helper preparation templates only—NOT official bank or IRS forms. Fill and export as US Letter or A4 PDFs directly in your browser.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FINANCIAL_TEMPLATES.map((tpl) => (
              <Link
                key={tpl.id}
                to={`/banking/financial-pdf-form-filler?template=${tpl.id}`}
                className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-white rounded-xl transition-all group"
              >
                <h3 className="text-sm font-bold text-[#17243A] group-hover:text-[#2563EB] mb-1">
                  {tpl.name}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed mb-2.5">{tpl.shortSummary}</p>
                <span className="text-[11px] font-mono text-[#2563EB] font-semibold">
                  Fill &amp; Export ({tpl.sections.length} sections) →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Optional Privacy-Preserving Local Log Control */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 my-10 shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#102A56] mb-1">
                {t('banking.optionalLogTitle')}
              </h2>
              <p className="text-xs text-[#64748B]">
                {t('banking.optionalLogDesc')}{' '}
                {optInLog
                  ? `(Recorded local tool runs: ${opCount})`
                  : '(Currently disabled — zero localStorage entries written)'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleOptIn}
                className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  optInLog
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#F4F7FB] text-[#17243A] border-[#E2E8F0] hover:border-[#2563EB]/40'
                }`}
              >
                {optInLog ? 'Disable Local Counters' : t('banking.optionalLogEnable')}
              </button>
              {optInLog && (
                <button
                  type="button"
                  onClick={handleClearLog}
                  className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F4F7FB] rounded-xl cursor-pointer"
                >
                  {t('banking.optionalLogClear')}
                </button>
              )}
            </div>
          </div>
        </section>

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
            {BANKING_HUB_FAQS.map((faq, idx) => (
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
