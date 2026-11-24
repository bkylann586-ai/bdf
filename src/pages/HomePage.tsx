import React, { useState, useEffect } from 'react';
import {
  Layers,
  Scissors,
  Minimize2,
  Image,
  FileImage,
  RotateCw,
  FileMinus,
  ArrowUpDown,
  Hash,
  Stamp,
  ScanText,
  FilePenLine,
  Unlock,
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

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5" />;
      case 'RotateCw':
        return <RotateCw className="w-5 h-5" />;
      case 'FileMinus':
        return <FileMinus className="w-5 h-5" />;
      case 'ArrowUpDown':
        return <ArrowUpDown className="w-5 h-5" />;
      case 'Minimize2':
        return <Minimize2 className="w-5 h-5" />;
      case 'Image':
        return <Image className="w-5 h-5" />;
      case 'FileImage':
        return <FileImage className="w-5 h-5" />;
      case 'Hash':
        return <Hash className="w-5 h-5" />;
      case 'Stamp':
        return <Stamp className="w-5 h-5" />;
      case 'ScanText':
        return <ScanText className="w-5 h-5" />;
      case 'FilePenLine':
        return <FilePenLine className="w-5 h-5" />;
      case 'Unlock':
        return <Unlock className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const visibleTools = searchTools(searchQuery);
  const matchedBankingServices = searchQuery.trim().length > 0 ? searchBankingServices(searchQuery) : [];

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

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-100 bg-gradient-to-b from-blue-50/40 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200/60 rounded-md text-xs font-medium mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Client-Side Processing · No Server Document Uploads</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto text-balance leading-tight mb-6">
            Fast, private PDF tools that never upload your documents.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Merge files, compress PDFs, run OCR on scans, edit PDF metadata, rotate or reorder pages, add page numbers, apply watermarks, and convert images directly inside your browser. Zero server uploads.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <span>Explore All 13 Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/banking-finance"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span>{t('nav.bankingFinance')}</span>
            </Link>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>How We Protect Privacy</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Complete In-Browser PDF Toolkit
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Search or select any tool below to edit, organize, or convert US Letter, UK A4, and international PDFs in seconds.
          </p>

          {/* Quick Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('tools.searchPlaceholder')}
              aria-label={t('tools.searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('tools.searchClear')}
                className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {visibleTools.length === 0 && matchedBankingServices.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto">
            <p className="text-sm text-slate-600 mb-3">{t('tools.noResults')}</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {t('tools.searchClear')}
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleTools.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleTools.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className="group bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-6 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 flex flex-col justify-between text-left"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                        {getToolIcon(tool.iconName)}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {tool.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {tool.shortDescription}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                      <span>Launch tool</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}

                {/* Privacy Info Card */}
                <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center mb-4">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Private & Confidential</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Whether handling tax returns, client legal contracts, or confidential receipts, your files are processed locally in your browser memory and never uploaded to remote servers.
                    </p>
                  </div>
                  <Link
                    to="/about"
                    className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-300 hover:text-white"
                  >
                    <span>Learn about local security</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {matchedBankingServices.length > 0 && (
              <div className="border-t border-slate-200 pt-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      {t('tools.cat.banking')} Matches ({matchedBankingServices.length})
                    </h3>
                  </div>
                  <Link to="/banking-finance" className="text-xs font-semibold text-blue-600 hover:underline">
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
                        className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-4 transition-all flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900">{service.name}</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isPlanned
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isPlanned ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {isPlanned ? t('banking.statusPlanned') : t('banking.statusActive')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {service.shortDescription}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Ad Placement */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
        <AdPlaceholder />
      </div>

      {/* Banking & Finance Expansion Showcase */}
      <section className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 rounded-md text-xs font-semibold mb-3">
                <Landmark className="w-3.5 h-3.5" />
                <span>{t('banking.badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                {t('banking.title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t('banking.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/banking-finance"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <span>Open Banking Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/banking/us-banks"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors"
              >
                <span>US Bank Guides</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>10 Live Financial PDF Workflows</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Merge 60-day mortgage statements, split annual PDFs, compress check scans, remove blank disclosures, number binders, rotate 1099s, and watermark lender copies locally.
              </p>
              <Link to="/banking-finance" className="text-blue-300 hover:text-white font-semibold inline-flex items-center gap-1">
                <span>Browse all 10 active workflows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5">
              <div className="flex items-center gap-2 text-blue-300 font-bold mb-2">
                <Landmark className="w-4 h-4" />
                <span>5 US Bank Statement Guides</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Independent user instructions for PDFs downloaded from {US_BANK_GUIDES.map((b) => b.bankName).join(', ')}—with zero logins or official affiliation.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {US_BANK_GUIDES.map((bank) => (
                  <Link
                    key={bank.slug}
                    to={bank.path}
                    className="px-2 py-1 bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-slate-200 font-medium transition-colors"
                  >
                    {bank.bankName}
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Form Filler &amp; True Redaction</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Fill 5 helper financial worksheets into print-ready US Letter/A4 PDFs, or permanently redact sensitive boxes and scrub Metadata/XMP offline.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/banking/financial-pdf-form-filler" className="text-blue-300 hover:text-white font-semibold inline-flex items-center gap-1">
                  <span>Form Filler</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/banking/financial-document-privacy" className="text-blue-300 hover:text-white font-semibold inline-flex items-center gap-1">
                  <span>Privacy Redaction</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PDFQuick Section */}
      <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Why Choose PDFQuick
            </h2>
            <p className="text-sm text-slate-600">
              Designed around document privacy, technical integrity, and real performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Zero Cloud Uploads
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Most web PDF editors upload your sensitive documents to remote third-party cloud servers. PDFQuick processes all files right inside your device browser memory.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Fast In-Browser Execution
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip file upload delays and server queue bottlenecks. With modern JavaScript and HTML5 Canvas execution, operations finish directly on your device without network transit.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Honest, Real Results
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No fake user counts, no marketing hyperbole, and no bogus claims of guaranteed compression. We provide accurate byte breakdowns and transparent limitations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Limits Notice */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
            In-Browser Performance Guidelines & Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            Because PDFQuick operates purely inside your web browser sandbox (without server processing), performance scales with your device CPU and available RAM:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Supported file sizes:</strong> Standard documents execute smoothly on modern computers. PDFQuick enforces a 250 MB safety limit per file and per multi-file queue to protect browser tab memory.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Standard formats:</strong> Works with standard PDF specifications (1.3 through 2.0), JPG, PNG, and WebP raster imagery across US Letter, Legal, and ISO A4 paper geometries.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Encrypted files:</strong> Password-locked PDFs can be decrypted locally in your browser using <Link to="/unlock-pdf" className="text-blue-600 hover:underline font-medium">Unlock PDF</Link> with your valid password before processing.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Landing Page Frequently Asked Questions (Synced with JSON-LD FAQPage Schema) */}
      <section id="faqs" className="pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {HOME_FAQS.map((faq, idx) => (
              <div
                key={faq.question}
                id={`home-faq-${idx + 1}`}
                className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  {faq.question}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
