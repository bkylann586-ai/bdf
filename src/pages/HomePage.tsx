import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Sparkles,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { TOOLS, searchTools } from '../lib/toolsCatalog';
import { BANKING_SERVICES, US_BANK_GUIDES, searchBankingServices } from '../lib/bankingCatalog';
import { ToolCategory, ToolMeta } from '../types';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildOrganizationSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import { navigate } from '../lib/router';
import { useGlobalDrop } from '../lib/globalDrop';
import { extractNativeFiles, hasNativeFilesInDragEvent } from '../lib/dragDropUtils';
import { formatBytes } from '../lib/fileHelpers';
import {
  HeroPdfIllustration,
  Upload3DIllustration,
  DocumentsOrganizeIllustration,
  EditingFormattingIllustration,
  LocalSecurityIllustration,
  ConversionEngineIllustration,
  EmptySearchIllustration,
  ToolIcon,
  getToolAccentTone,
  ToolAccentTone,
} from '../components/illustrations/PdfIllustrations';
import { useTranslation, getLocalizedToolMeta } from '../lib/i18n';
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

const MAX_BYTES = 250 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isImageFile(file: File): boolean {
  return /^image\/(jpeg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

const TONE_STYLES: Record<
  ToolAccentTone,
  { borderHover: string; linkText: string; topStripe: string; categoryText: string }
> = {
  blue: {
    borderHover: 'hover:border-[#2563EB]',
    linkText: 'text-[#2563EB]',
    topStripe: 'bg-[#2563EB]',
    categoryText: 'text-[#2563EB]',
  },
  purple: {
    borderHover: 'hover:border-[#7C3AED]',
    linkText: 'text-[#7C3AED]',
    topStripe: 'bg-[#7C3AED]',
    categoryText: 'text-[#7C3AED]',
  },
  emerald: {
    borderHover: 'hover:border-[#10B981]',
    linkText: 'text-[#059669]',
    topStripe: 'bg-[#10B981]',
    categoryText: 'text-[#059669]',
  },
  amber: {
    borderHover: 'hover:border-[#F59E0B]',
    linkText: 'text-[#D97706]',
    topStripe: 'bg-[#F59E0B]',
    categoryText: 'text-[#D97706]',
  },
};

export const HomePage: React.FC = () => {
  const { t, language } = useTranslation();
  const { setPendingDropFiles, clearPendingDropFiles } = useGlobalDrop();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all' | 'banking'>('all');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isQuickDragActive, setIsQuickDragActive] = useState(false);
  const [quickDropError, setQuickDropError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    return injectFaqSchema(HOME_FAQS, {
      toolId: 'home',
      pageUrl: getProductionBaseUrl(),
    });
  }, []);

  const handleQuickFiles = (incoming: File[]) => {
    setQuickDropError(null);
    const valid = incoming.filter((f) => isPdfFile(f) || isImageFile(f));
    if (valid.length === 0) {
      setQuickDropError(t('dropzone.invalidType'));
      return;
    }
    const totalSize = valid.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_BYTES || valid.some((f) => f.size > MAX_BYTES)) {
      setQuickDropError(t('dropzone.sizeLimit'));
      return;
    }
    setQueuedFiles(valid);
    setPendingDropFiles(valid);
  };

  const handleLoadSamplePdf = async () => {
    setQuickDropError(null);
    setLoadingSample(true);
    try {
      const { createSamplePdf } = await import('../lib/sampleFiles');
      const sample = await createSamplePdf('PDFQuick Demo Statement', 3);
      setQueuedFiles([sample]);
      setPendingDropFiles([sample]);
    } catch {
      setQuickDropError('Unable to create sample PDF in this browser session.');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleClearQuickFiles = () => {
    setQueuedFiles([]);
    setQuickDropError(null);
    clearPendingDropFiles();
  };

  const pdfFiles = queuedFiles.filter(isPdfFile);
  const imageFiles = queuedFiles.filter(isImageFile);
  const totalQueuedBytes = queuedFiles.reduce((acc, f) => acc + f.size, 0);

  const getSuggestedTools = (): ToolMeta[] => {
    if (imageFiles.length > 0 && pdfFiles.length === 0) {
      return TOOLS.filter((tool) => tool.id === 'images-to-pdf');
    }
    if (pdfFiles.length > 1) {
      const order = [
        'merge-pdf',
        'compress-pdf',
        'rotate-pdf',
        'add-page-numbers',
        'watermark-pdf',
        'pdf-to-images',
      ];
      return order
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter((tool): tool is ToolMeta => Boolean(tool));
    }
    if (pdfFiles.length === 1) {
      const order = [
        'split-pdf',
        'compress-pdf',
        'rotate-pdf',
        'delete-pdf-pages',
        'reorder-pdf-pages',
        'add-page-numbers',
        'watermark-pdf',
        'ocr-pdf',
        'edit-pdf-metadata',
        'unlock-pdf',
        'pdf-to-images',
      ];
      return order
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter((tool): tool is ToolMeta => Boolean(tool));
    }
    return [];
  };

  const handleLaunchSuggestedTool = (tool: ToolMeta) => {
    const matching =
      tool.id === 'images-to-pdf'
        ? imageFiles
        : pdfFiles.length > 0
          ? tool.supportsMultiple
            ? pdfFiles
            : [pdfFiles[0]]
          : queuedFiles;
    if (matching.length > 0) {
      setPendingDropFiles(matching);
    }
    navigate(tool.path);
  };

  const visibleTools =
    activeCategory === 'banking' ? [] : searchTools(searchQuery, activeCategory);
  const matchedBankingServices =
    activeCategory === 'banking'
      ? searchBankingServices(searchQuery)
      : searchQuery.trim().length > 0
        ? searchBankingServices(searchQuery)
        : [];

  const categoryTabs: { id: ToolCategory | 'all' | 'banking'; label: string; count: number }[] = [
    { id: 'all', label: t('tools.cat.all'), count: TOOLS.length },
    {
      id: 'organize',
      label: t('tools.cat.organize'),
      count: TOOLS.filter((i) => i.category === 'organize').length,
    },
    {
      id: 'edit',
      label: t('tools.cat.edit'),
      count: TOOLS.filter((i) => i.category === 'edit').length,
    },
    {
      id: 'optimize',
      label: t('tools.cat.optimize'),
      count: TOOLS.filter((i) => i.category === 'optimize').length,
    },
    {
      id: 'convert',
      label: t('tools.cat.convert'),
      count: TOOLS.filter((i) => i.category === 'convert').length,
    },
    { id: 'banking', label: t('tools.cat.banking'), count: BANKING_SERVICES.length },
  ];

  const displayFaqs =
    language === 'en'
      ? HOME_FAQS
      : [
          { question: t('home.faq1Q'), answer: t('home.faq1A') },
          { question: t('home.faq2Q'), answer: t('home.faq2A') },
          { question: t('home.faq3Q'), answer: t('home.faq3A') },
          { question: t('home.faq4Q'), answer: t('home.faq4A') },
        ];

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

  const suggestedTools = getSuggestedTools();

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

      {/* Flagship Studio Hero with Interactive Quick-Drop Workspace */}
      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-pq-hero">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column: Brand Statement, Primary Actions & Architectural Trust Line */}
            <div className="lg:col-span-6 text-start pt-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563EB] mb-4">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{t('home.heroBadge')}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12] mb-5">
                {t('home.heroTitle')}
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed mb-7 max-w-xl">
                {t('home.heroSubtitle')}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-7">
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2 px-6 min-h-[46px] text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.24)] transition-all whitespace-nowrap"
                >
                  <span>{t('home.ctaExplore')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
                <Link
                  to="/merge-pdf"
                  className="inline-flex items-center gap-2 px-5 min-h-[46px] text-sm font-semibold text-[#0F172A] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB]/50 rounded-xl shadow-xs transition-colors whitespace-nowrap"
                >
                  <span>{t('home.ctaMerge')}</span>
                </Link>
                <Link
                  to="/banking-finance"
                  className="inline-flex items-center gap-2 px-4 min-h-[46px] text-sm font-semibold text-[#065F46] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl transition-colors whitespace-nowrap"
                >
                  <Landmark className="w-4 h-4 text-[#10B981]" />
                  <span>{t('nav.bankingFinance')}</span>
                </Link>
              </div>

              {/* Clean unboxed typographic specification bar */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono tabular-nums text-[#64748B] mb-8 lg:mb-0">
                <span className="font-semibold text-[#0F172A]">15 Browser Tools</span>
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

            {/* Right Column: 3D Stage + Interactive Quick-Drop File Launcher */}
            <div className="lg:col-span-6 space-y-5">
              {/* Interactive Quick-Drop Workspace Card */}
              <div
                onDragEnter={(e) => {
                  if (!hasNativeFilesInDragEvent(e.dataTransfer)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickDragActive(true);
                }}
                onDragOver={(e) => {
                  if (!hasNativeFilesInDragEvent(e.dataTransfer)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                  setIsQuickDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickDragActive(false);
                  const dropped = extractNativeFiles(e.dataTransfer);
                  if (dropped.length > 0) {
                    handleQuickFiles(dropped);
                  }
                }}
                className={`rounded-2xl bg-white border-2 transition-all p-5 sm:p-6 shadow-[0_14px_34px_-12px_rgba(37,99,235,0.16)] ${
                  isQuickDragActive
                    ? 'border-[#2563EB] bg-[#EFF6FF]/60 ring-4 ring-[#2563EB]/15'
                    : 'border-dashed border-[#CBD5E1] hover:border-[#2563EB]/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleQuickFiles(Array.from(e.target.files));
                    }
                    e.target.value = '';
                  }}
                />

                {queuedFiles.length === 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
                    <Upload3DIllustration active={isQuickDragActive} className="shrink-0" />

                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A] mb-1">
                        {t('home.quickDropTitle')}
                      </h2>
                      <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                        {t('home.quickDropSubtitle')}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 min-h-[42px] text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{t('home.quickDropChoose')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleLoadSamplePdf}
                          disabled={loadingSample}
                          className="inline-flex items-center gap-1.5 px-3.5 min-h-[42px] text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB]/40 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>{loadingSample ? '...' : t('home.quickDropSample')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Queued File Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
                          {imageFiles.length > 0 && pdfFiles.length === 0 ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 text-start">
                          <p className="text-xs sm:text-sm font-bold text-[#0F172A] tabular-nums truncate">
                            {t('home.quickDropReady', {
                              count: queuedFiles.length,
                              size: formatBytes(totalQueuedBytes),
                            })}
                          </p>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {queuedFiles.map((f) => f.name).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors cursor-pointer"
                        >
                          + {t('home.quickDropChoose')}
                        </button>
                        <button
                          type="button"
                          onClick={handleClearQuickFiles}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-[#64748B] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          {t('home.quickDropClear')}
                        </button>
                      </div>
                    </div>

                    <div className="text-start">
                      <p className="text-xs font-semibold text-[#0F172A] mb-1">
                        {t('home.quickDropChooseAction')}
                      </p>
                      <p className="text-[11px] text-[#64748B] mb-3">
                        {imageFiles.length > 0 && pdfFiles.length === 0
                          ? t('home.quickDropImgHint')
                          : t('home.quickDropPdfHint')}
                      </p>

                      {/* 1-Click Tool Launcher Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {suggestedTools.map((tool, index) => {
                          const localized = getLocalizedToolMeta(tool, t);
                          const isPrimarySuggestion = index === 0;
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => handleLaunchSuggestedTool(tool)}
                              className={`group flex items-center gap-2 p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                                isPrimarySuggestion
                                  ? 'bg-[#EFF6FF] border-[#2563EB] hover:bg-[#DBEAFE]/70 shadow-xs'
                                  : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white hover:border-[#2563EB]'
                              }`}
                            >
                              <ToolIcon name={tool.iconName} size="sm" />
                              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] leading-tight truncate">
                                {localized.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {quickDropError && (
                  <p className="mt-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-start">
                    {quickDropError}
                  </p>
                )}
              </div>

              {/* 3D Floating Hero Composition */}
              <div className="rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06)] bg-white p-1.5 border border-[#E2E8F0]">
                <HeroPdfIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete In-Browser PDF Toolkit Discovery */}
      <section id="toolkit" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
          <div className="max-w-2xl text-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] block mb-1.5">
              {t('home.toolkitEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              {t('home.toolkitTitle')}
            </h2>
            <p className="text-sm text-[#64748B]">
              {t('home.toolkitSubtitle')}
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
              className="w-full ps-10 pe-10 min-h-[44px] text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('tools.searchClear')}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] absolute end-2 top-1/2 -translate-y-1/2 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Interactive Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {categoryTabs.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer tabular-nums ${
                  isActive
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#0F172A]'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>

        {visibleTools.length === 0 && matchedBankingServices.length === 0 ? (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-10 text-center max-w-lg mx-auto">
            <EmptySearchIllustration className="mb-4" />
            <p className="text-sm text-[#64748B] mb-4">{t('tools.noResults')}</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 min-h-[40px] text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors cursor-pointer"
            >
              {t('tools.searchClear')}
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleTools.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleTools.map((tool) => {
                  const tone = getToolAccentTone(tool.iconName);
                  const toneStyle = TONE_STYLES[tone];
                  const localized = getLocalizedToolMeta(tool, t);
                  const categoryLabel = t(`tools.cat.${tool.category}`);
                  return (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      className={`group relative overflow-hidden pq-card pq-card-hover ${toneStyle.borderHover} p-6 flex flex-col justify-between text-start`}
                    >
                      <div
                        className={`absolute top-0 inset-x-0 h-1 ${toneStyle.topStripe} opacity-80 group-hover:opacity-100 transition-opacity`}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                          <ToolIcon name={tool.iconName} size="lg" />
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${toneStyle.categoryText}`}
                          >
                            {categoryLabel}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors mb-2">
                          {localized.name}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                          {localized.shortDescription}
                        </p>
                      </div>

                      <div
                        className={`pt-5 mt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold ${toneStyle.linkText}`}
                      >
                        <span>{t('home.launchTool')}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}

                {/* Deep Navy Private Architecture Callout Card */}
                <div className="bg-gradient-to-br from-[#0F172A] to-[#102A56] text-white rounded-2xl p-6 flex flex-col justify-between border border-[#1E3A8A]/40 shadow-[0_12px_28px_rgba(15,23,42,0.14)] text-start">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 text-[#34D399] flex items-center justify-center mb-4">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {t('home.privateCardTitle')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {t('home.privateCardDesc')}
                    </p>
                  </div>
                  <Link
                    to="/about"
                    className="pt-5 mt-5 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-[#38BDF8] hover:text-white transition-colors"
                  >
                    <span>{t('home.privateCardCta')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            )}

            {matchedBankingServices.length > 0 && (
              <div className="border-t border-[#E2E8F0] pt-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#10B981]" />
                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      {t('tools.cat.banking')} ({matchedBankingServices.length})
                    </h3>
                  </div>
                  <Link
                    to="/banking-finance"
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    {t('home.bankingExplore')}
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedBankingServices.map((service) => {
                    const isPlanned = service.status === 'planned';
                    return (
                      <Link
                        key={service.id}
                        to={service.primaryPath}
                        className="bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl p-4 transition-all flex items-start justify-between gap-4 text-start"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-[#0F172A]">
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
                        <ArrowRight className="w-4 h-4 text-[#2563EB] shrink-0 mt-1 rtl:rotate-180" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4-Card Illustrated Workflow Capabilities Showcase */}
      <section className="py-14 bg-[#F8FAFC] border-t border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 text-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] block mb-1.5">
              {t('home.capabilitiesEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              {t('home.capabilitiesTitle')}
            </h2>
            <p className="text-sm text-[#64748B]">
              {t('home.capabilitiesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="pq-card p-5 text-start flex flex-col justify-between">
              <div>
                <div className="mb-4 rounded-xl overflow-hidden border border-[#DBEAFE]">
                  <DocumentsOrganizeIllustration />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
                  {t('home.cap1Title')}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {t('home.cap1Desc')}
                </p>
              </div>
              <Link
                to="/merge-pdf"
                className="mt-4 pt-3 border-t border-[#E2E8F0] inline-flex items-center justify-between text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <span>{t('nav.merge')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="pq-card p-5 text-start flex flex-col justify-between">
              <div>
                <div className="mb-4 rounded-xl overflow-hidden border border-[#EDE9FE]">
                  <EditingFormattingIllustration />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
                  {t('home.cap2Title')}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {t('home.cap2Desc')}
                </p>
              </div>
              <Link
                to="/watermark-pdf"
                className="mt-4 pt-3 border-t border-[#E2E8F0] inline-flex items-center justify-between text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                <span>{t('nav.watermark')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="pq-card p-5 text-start flex flex-col justify-between">
              <div>
                <div className="mb-4 rounded-xl overflow-hidden border border-[#D1FAE5] bg-[#ECFDF5] p-3 flex items-center justify-center min-h-[128px]">
                  <div className="flex items-center gap-3">
                    <ToolIcon name="Minimize2" size="lg" />
                    <ToolIcon name="PrivacyRedact" size="lg" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
                  {t('home.cap3Title')}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {t('home.cap3Desc')}
                </p>
              </div>
              <Link
                to="/compress-pdf"
                className="mt-4 pt-3 border-t border-[#E2E8F0] inline-flex items-center justify-between text-xs font-semibold text-[#059669] hover:underline"
              >
                <span>{t('nav.compress')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="pq-card p-5 text-start flex flex-col justify-between">
              <div>
                <div className="mb-4 rounded-xl overflow-hidden border border-[#FEF3C7]">
                  <ConversionEngineIllustration />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
                  {t('home.cap4Title')}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {t('home.cap4Desc')}
                </p>
              </div>
              <Link
                to="/images-to-pdf"
                className="mt-4 pt-3 border-t border-[#E2E8F0] inline-flex items-center justify-between text-xs font-semibold text-[#D97706] hover:underline"
              >
                <span>{t('nav.imagesToPdf')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Placement (Between Tool Groups, Outside Clickable Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AdPlaceholder placement="home-between-groups" />
      </div>

      {/* Banking & Finance Expansion Showcase */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#0F172A] to-[#102A56] text-white rounded-2xl p-6 sm:p-10 border border-[#1E3A8A]/50 shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 text-start">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-[#34D399] text-xs font-semibold mb-2">
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
                className="inline-flex items-center gap-2 px-5 min-h-[42px] text-xs sm:text-sm font-semibold bg-[#2563EB] hover:bg-[#3B82F6] text-white rounded-xl transition-colors"
              >
                <span>{t('home.bankingExplore')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/banking/us-banks"
                className="inline-flex items-center gap-2 px-4 min-h-[42px] text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl transition-colors"
              >
                <span>US Bank Guides</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-start">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-[#34D399] font-bold mb-2">
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
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
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
              <div className="flex items-center gap-2 text-[#34D399] font-bold mb-2">
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
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
                <Link
                  to="/banking/financial-document-privacy"
                  className="text-[#38BDF8] hover:text-white font-semibold inline-flex items-center gap-1"
                >
                  <span>Privacy Redaction</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture & Why Choose PDFQuick */}
      <section className="py-16 bg-[#F8FAFC] border-t border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-12">
            <div className="lg:col-span-6 text-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] block mb-1.5">
                Browser-Native Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
                {t('home.whyTitle')}
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                {t('home.whySubtitle')}
              </p>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-white border border-[#E2E8F0] p-2 shadow-xs">
                <LocalSecurityIllustration />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
            <div className="pq-card p-6">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center mb-4">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">Zero Cloud Uploads</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Most web PDF editors upload your sensitive documents to remote third-party cloud servers. PDFQuick processes all files right inside your device browser memory.
              </p>
            </div>

            <div className="pq-card p-6">
              <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                Fast In-Browser Execution
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Skip file upload delays and server queue bottlenecks. With modern JavaScript and HTML5 Canvas execution, operations finish directly on your device without network transit.
              </p>
            </div>

            <div className="pq-card p-6">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#10B981] flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">Honest, Real Results</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                No fake user counts, no marketing hyperbole, and no bogus claims of guaranteed compression. We provide accurate byte breakdowns and transparent limitations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Limits Notice */}
      <section className="py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        <div className="pq-card p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-3">
            {t('home.limitsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-4">
            Because PDFQuick operates purely inside your web browser sandbox (without server processing), performance scales with your device CPU and available RAM:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-[#64748B]">
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#0F172A]">Supported file sizes:</strong> Standard documents execute smoothly on modern computers. PDFQuick enforces a 250 MB safety limit per file and per multi-file queue to protect browser tab memory.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#0F172A]">Standard formats:</strong> Works with standard PDF specifications (1.3 through 2.0), JPG, PNG, and WebP raster imagery across US Letter, Legal, and ISO A4 paper geometries.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#0F172A]">Encrypted files:</strong> Password-locked PDFs can be decrypted locally in your browser using{' '}
                <Link to="/unlock-pdf" className="text-[#2563EB] hover:underline font-semibold">
                  {t('nav.unlockPdf')}
                </Link>{' '}
                with your valid password before processing.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Landing Page Frequently Asked Questions */}
      <section id="faqs" className="pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        <div className="pq-card p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              {t('home.faqsTitle')}
            </h2>
          </div>

          <div className="space-y-4">
            {displayFaqs.map((faq, idx) => (
              <div
                key={faq.question}
                id={`home-faq-${idx + 1}`}
                className="pb-4 border-b border-[#E2E8F0] last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-bold text-[#0F172A] mb-1.5">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
