import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  HardDrive,
  Cpu,
  CheckCircle,
  Search,
  X,
  Landmark,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { searchTools } from '../lib/toolsCatalog';
import { US_BANK_GUIDES, searchBankingServices } from '../lib/bankingCatalog';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildOrganizationSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import {
  HeroPdfIllustration,
  LocalSecurityIllustration,
  EmptySearchIllustration,
  ToolIcon,
} from '../components/illustrations/PdfIllustrations';
import { useTranslation } from '../lib/i18n';
import { injectFaqSchema, FaqSchemaItem } from '../lib/faqSchema';

const HOME_FAQS: FaqSchemaItem[] = [
  {
    question: 'Are my PDFs and bank statements uploaded to PDFQuick servers?',
    answer:
      'No. All PDFQuick tools run 100% locally inside your web browser using JavaScript, pdf-lib, PDF.js, and HTML5 Canvas. Your documents, financial statements, and images never leave your device or get transmitted to remote servers.',
  },
  {
    question: 'Are all 13 PDFQuick tools free to use without registration?',
    answer:
      'Yes. All 13 core PDF utilities and Banking & Finance tools are free to use with no account registration, no email sign-up, and no forced PDFQuick watermarks added to your downloaded files.',
  },
  {
    question: 'Which PDF operations can I perform with PDFQuick?',
    answer:
      'You can merge PDFs, split page ranges, compress PDF size, convert JPG/PNG/WebP images to PDF, export PDF pages to PNG or JPEG images, rotate pages, delete or reorder pages, add page numbers, apply text watermarks, run in-browser OCR to build searchable PDFs, edit PDF metadata, and unlock password-protected PDFs.',
  },
  {
    question: 'Can I edit PDF metadata or run OCR on scanned PDFs offline?',
    answer:
      'Yes. Once loaded, PDFQuick supports Progressive Web App (PWA) offline caching so core tools work without an active internet connection. Edit PDF Metadata runs purely locally, and OCR PDF uses a lazy-loaded Tesseract.js WebAssembly worker with language dictionaries cached locally in your browser.',
  },
  {
    question: 'Does PDFQuick support US Letter, ISO A4, and Arabic or multilingual documents?',
    answer:
      'Yes. PDFQuick supports US Letter, Legal, and ISO A4 paper sizes, offers an interface in English, Spanish, French, and Arabic, and embeds Noto Sans and Noto Sans Arabic fonts for accurate bilingual and right-to-left PDF text output.',
  },
  {
    question: 'What are the file size limits and can PDFQuick process encrypted PDFs?',
    answer:
      'To protect browser tab memory, PDFQuick enforces a 250 MB safety limit per file and per multi-file queue. For password-protected or encrypted PDFs, use our Unlock PDF tool locally with your valid password before running other PDFQuick operations.',
  },
];

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return injectFaqSchema(HOME_FAQS, {
      toolId: 'home',
      pageUrl: getProductionBaseUrl(),
    });
  }, []);

  const visibleTools = searchTools(searchQuery);
  const matchedBankingServices =
    searchQuery.trim().length > 0 ? searchBankingServices(searchQuery) : [];

  const baseUrl = getProductionBaseUrl();
  const homeUrl = `${baseUrl}/`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(baseUrl),
      {
        '@type': 'WebApplication',
        '@id': `${homeUrl}#webapp`,
        name: 'PDFQuick',
        url: homeUrl,
        publisher: { '@id': `${baseUrl}/#organization` },
        description:
          'Free, private online PDF tools for US, UK, and international users. Merge, split, compress, OCR scanned PDFs, edit PDF metadata, rotate, delete pages, reorder, number pages, watermark, and convert PDF documents locally in your browser.',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All web browsers',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };

  return (
    <div className="flex-1 bg-white">
      <SeoMeta
        title="PDFQuick – 13 Free, Private Online PDF Tools (Merge, Compress, OCR & Unlock)"
        description="Free in-browser PDF tools with zero server uploads: Merge PDF, Split PDF, Compress PDF, OCR PDF to searchable text, Edit PDF Metadata, Unlock PDF, JPG to PDF, Rotate, Watermark, and Number Pages."
        path="/"
        schema={schema}
        faqs={HOME_FAQS}
      />

      {/* Optional Top Advertising Area (Below Header, Before Main Content) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdPlaceholder placement="home-top" className="my-4" />
      </div>

      {/* Asymmetric Architectural SaaS Hero */}
      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-white">
        <div className="absolute inset-0 bg-pq-dots opacity-65 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Copy & Primary Actions */}
            <div className="lg:col-span-6 text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4F7FB] text-[#102A56] border border-[#E2E8F0] rounded-lg text-xs font-semibold mb-5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>Client-Side Processing · Zero Server Uploads</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A56] tracking-tight leading-[1.12] mb-5">
                Fast, private PDF tools that never upload your documents.
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed mb-7 max-w-xl">
                Merge files, compress PDFs, run OCR on scans, edit PDF metadata, rotate or reorder pages, add page numbers, apply watermarks, and convert images directly inside your browser. Zero server uploads.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-7">
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2 px-6 min-h-[46px] text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs transition-colors whitespace-nowrap"
                >
                  <span>Explore All 13 Tools</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/merge-pdf"
                  className="inline-flex items-center gap-2 px-5 min-h-[46px] text-sm font-semibold text-[#102A56] bg-[#F4F7FB] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB]/50 rounded-xl transition-colors whitespace-nowrap"
                >
                  <span>Start with Merge PDF</span>
                </Link>
                <Link
                  to="/banking-finance"
                  className="inline-flex items-center gap-2 px-4 min-h-[46px] text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  <Landmark className="w-4 h-4 text-emerald-700" />
                  <span>{t('nav.bankingFinance')}</span>
                </Link>
              </div>

              {/* Clean typographic specification bar (no pill clutter) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono tabular-nums text-[#64748B]">
                <span className="font-semibold text-[#102A56]">15 Browser Tools</span>
                <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
                <span>100% Local RAM</span>
                <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
                <span>Up to 250 MB</span>
                <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
                <Link to="/privacy" className="font-sans font-semibold text-[#2563EB] hover:underline">
                  How We Protect Privacy
                </Link>
              </div>
            </div>

            {/* Hero Workspace Visual */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl shadow-[0_12px_36px_rgba(16,42,86,0.08)] bg-white p-1.5 border border-[#E2E8F0]">
                <HeroPdfIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete In-Browser PDF Toolkit Discovery */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl text-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] block mb-1.5">
              Document Workspace Suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A56] tracking-tight mb-2">
              Complete In-Browser PDF Toolkit
            </h2>
            <p className="text-sm text-[#64748B]">
              Search or select any tool below to edit, organize, or convert US Letter, UK A4, and international PDFs in seconds.
            </p>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full md:w-96 shrink-0">
            <Search className="w-4 h-4 text-[#64748B] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('tools.searchPlaceholder')}
              aria-label={t('tools.searchPlaceholder')}
              className="w-full ps-10 pe-10 min-h-[44px] text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] placeholder:text-[#64748B] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('tools.searchClear')}
                className="p-1.5 text-[#64748B] hover:text-[#102A56] absolute end-2 top-1/2 -translate-y-1/2 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {visibleTools.length === 0 && matchedBankingServices.length === 0 ? (
          <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-2xl p-10 text-center max-w-lg mx-auto">
            <EmptySearchIllustration className="mb-4" />
            <p className="text-sm text-[#64748B] mb-4">{t('tools.noResults')}</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-5 min-h-[40px] text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors cursor-pointer"
            >
              {t('tools.searchClear')}
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleTools.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleTools.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className="group bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,42,86,0.06)] flex flex-col justify-between text-start"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <ToolIcon name={tool.iconName} size="lg" />
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] bg-[#F4F7FB] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                          {tool.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#102A56] group-hover:text-[#2563EB] transition-colors mb-2">
                        {tool.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {tool.shortDescription}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                      <span>Launch tool</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}

                {/* Deep Navy Private Architecture Callout Card */}
                <div className="bg-[#102A56] text-white rounded-2xl p-6 flex flex-col justify-between border border-[#1A3C75]">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 text-[#38BDF8] flex items-center justify-center mb-4">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Private & Confidential</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Whether handling tax returns, client legal contracts, or confidential receipts, your files are processed locally in your browser memory and never uploaded to remote servers.
                    </p>
                  </div>
                  <Link
                    to="/about"
                    className="pt-5 mt-5 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-[#38BDF8] hover:text-white transition-colors"
                  >
                    <span>Learn about local security</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {matchedBankingServices.length > 0 && (
              <div className="border-t border-[#E2E8F0] pt-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-[#102A56] uppercase tracking-wider">
                      {t('tools.cat.banking')} Matches ({matchedBankingServices.length})
                    </h3>
                  </div>
                  <Link
                    to="/banking-finance"
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    View Full Banking Hub →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedBankingServices.map((service) => {
                    const isPlanned = service.status === 'planned';
                    return (
                      <Link
                        key={service.id}
                        to={service.primaryPath}
                        className="bg-[#F4F7FB] hover:bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl p-4 transition-all flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-[#102A56]">
                              {service.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isPlanned
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isPlanned ? (
                                <Clock className="w-3 h-3" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {isPlanned ? t('banking.statusPlanned') : t('banking.statusActive')}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {service.shortDescription}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Ad Placement (Between Tool Groups, Outside Clickable Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdPlaceholder placement="home-between-groups" />
      </div>

      {/* Banking & Finance Expansion Showcase */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#102A56] text-white rounded-2xl p-6 sm:p-10 border border-[#1A3C75] shadow-[0_10px_28px_rgba(16,42,86,0.12)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-[#38BDF8] border border-white/15 rounded-lg text-xs font-semibold mb-3">
                <Landmark className="w-3.5 h-3.5" />
                <span>{t('banking.badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                {t('banking.title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t('banking.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/banking-finance"
                className="inline-flex items-center gap-2 px-5 min-h-[42px] text-xs sm:text-sm font-semibold bg-[#2563EB] hover:bg-[#38BDF8] hover:text-[#102A56] text-white rounded-xl transition-colors"
              >
                <span>Open Banking Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/banking/us-banks"
                className="inline-flex items-center gap-2 px-4 min-h-[42px] text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl transition-colors"
              >
                <span>US Bank Guides</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>10 Live Financial PDF Workflows</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Merge 60-day mortgage statements, split annual PDFs, compress check scans, remove blank disclosures, number binders, rotate 1099s, and watermark lender copies locally.
              </p>
              <Link
                to="/banking-finance"
                className="text-[#38BDF8] hover:text-white font-semibold inline-flex items-center gap-1"
              >
                <span>Browse all 10 active workflows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-[#38BDF8] font-bold mb-2">
                <Landmark className="w-4 h-4" />
                <span>5 US Bank Statement Guides</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Independent user instructions for PDFs downloaded from{' '}
                {US_BANK_GUIDES.map((b) => b.bankName).join(', ')}—with zero logins or official affiliation.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {US_BANK_GUIDES.map((bank) => (
                  <Link
                    key={bank.slug}
                    to={bank.path}
                    className="px-2.5 py-1 bg-[#1A3C75] hover:bg-[#2563EB] border border-white/15 rounded-md text-[11px] text-white font-medium transition-colors"
                  >
                    {bank.bankName}
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Form Filler &amp; True Redaction</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Fill 5 helper financial worksheets into print-ready US Letter/A4 PDFs, or permanently redact sensitive boxes and scrub Metadata/XMP offline.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/banking/financial-pdf-form-filler"
                  className="text-[#38BDF8] hover:text-white font-semibold inline-flex items-center gap-1"
                >
                  <span>Form Filler</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/banking/financial-document-privacy"
                  className="text-[#38BDF8] hover:text-white font-semibold inline-flex items-center gap-1"
                >
                  <span>Privacy Redaction</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture & Why Choose PDFQuick */}
      <section className="py-16 bg-[#F4F7FB] border-t border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-12">
            <div className="lg:col-span-6 text-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] block mb-1.5">
                Browser-Native Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A56] tracking-tight mb-3">
                Why Choose PDFQuick
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Designed around strict document privacy, deterministic client-side processing, and transparent performance—so confidential PDFs stay inside your device memory from start to download.
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-white border border-[#E2E8F0] p-2">
                <LocalSecurityIllustration />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-[#F4F7FB] border border-[#E2E8F0] text-[#102A56] flex items-center justify-center mb-4">
                <HardDrive className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-base font-bold text-[#102A56] mb-2">Zero Cloud Uploads</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Most web PDF editors upload your sensitive documents to remote third-party cloud servers. PDFQuick processes all files right inside your device browser memory.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-[#F4F7FB] border border-[#E2E8F0] text-[#102A56] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-base font-bold text-[#102A56] mb-2">
                Fast In-Browser Execution
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Skip file upload delays and server queue bottlenecks. With modern JavaScript and HTML5 Canvas execution, operations finish directly on your device without network transit.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-[#F4F7FB] border border-[#E2E8F0] text-[#102A56] flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-base font-bold text-[#102A56] mb-2">Honest, Real Results</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                No fake user counts, no marketing hyperbole, and no bogus claims of guaranteed compression. We provide accurate byte breakdowns and transparent limitations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Limits Notice */}
      <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-[#102A56] mb-3">
            In-Browser Performance Guidelines & Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-4">
            Because PDFQuick operates purely inside your web browser sandbox (without server processing), performance scales with your device CPU and available RAM:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-[#64748B]">
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#17243A]">Supported file sizes:</strong> Standard documents execute smoothly on modern computers. PDFQuick enforces a 250 MB safety limit per file and per multi-file queue to protect browser tab memory.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#17243A]">Standard formats:</strong> Works with standard PDF specifications (1.3 through 2.0), JPG, PNG, and WebP raster imagery across US Letter, Legal, and ISO A4 paper geometries.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#17243A]">Encrypted files:</strong> Password-locked PDFs can be decrypted locally in your browser using{' '}
                <Link to="/unlock-pdf" className="text-[#2563EB] hover:underline font-semibold">
                  Unlock PDF
                </Link>{' '}
                with your valid password before processing.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Landing Page Frequently Asked Questions */}
      <section id="faqs" className="pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {HOME_FAQS.map((faq, idx) => (
              <div
                key={faq.question}
                id={`home-faq-${idx + 1}`}
                className="pb-4 border-b border-[#E2E8F0] last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-bold text-[#17243A] mb-1.5">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
