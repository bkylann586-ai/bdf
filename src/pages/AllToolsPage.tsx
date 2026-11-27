import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  X,
  Landmark,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { TOOLS, searchTools } from '../lib/toolsCatalog';
import { BANKING_SERVICES, searchBankingServices } from '../lib/bankingCatalog';
import { BankingServiceMeta, ToolCategory, ToolMeta } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdPlaceholder } from '../components/AdPlaceholder';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { Link } from '../components/Link';
import {
  EmptySearchIllustration,
  ToolIcon,
} from '../components/illustrations/PdfIllustrations';
import { useTranslation } from '../lib/i18n';

export const AllToolsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all' | 'banking'>('all');

  const filteredTools =
    activeCategory === 'banking' ? [] : searchTools(searchQuery, activeCategory);
  const organizeTools = filteredTools.filter((item) => item.category === 'organize');
  const optimizeTools = filteredTools.filter((item) => item.category === 'optimize');
  const convertTools = filteredTools.filter((item) => item.category === 'convert');
  const editTools = filteredTools.filter((item) => item.category === 'edit');

  const matchedBankingServices: BankingServiceMeta[] =
    activeCategory === 'banking'
      ? searchBankingServices(searchQuery)
      : activeCategory === 'all' && searchQuery.trim().length > 0
        ? searchBankingServices(searchQuery)
        : [];

  const categories: { id: ToolCategory | 'all' | 'banking'; label: string; count: number }[] = [
    { id: 'all', label: t('tools.cat.all'), count: TOOLS.length },
    { id: 'banking', label: t('tools.cat.banking'), count: BANKING_SERVICES.length },
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
  ];

  const renderCategorySection = (title: string, items: ToolMeta[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-12">
        <div className="border-b border-[#E2E8F0] pb-2.5 mb-6 flex items-center justify-between">
          <h2 className="font-bold text-[#102A56] uppercase tracking-wider text-xs">
            {title}
          </h2>
          <span className="text-xs font-mono text-[#64748B]">{items.length} tools</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(16,42,86,0.06)] group flex flex-col justify-between text-start"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-3">
                  <ToolIcon name={tool.iconName} size="md" />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#102A56] group-hover:text-[#2563EB] transition-colors">
                      {tool.name}
                    </h3>
                    <span className="text-[11px] font-mono text-[#64748B] block truncate">
                      Accepted: {tool.acceptTypes}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                <span>Open {tool.name}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const baseUrl = getProductionBaseUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/tools#webpage`,
        name: 'All 13 PDF Tools – Merge, Compress, OCR, Unlock & Edit PDFs Free | PDFQuick',
        url: `${baseUrl}/tools`,
        description:
          'Explore all 13 free in-browser PDF tools: Merge, Split, Compress, OCR PDF, Edit PDF Metadata, Unlock PDF, Rotate, Delete Pages, Reorder, Images to PDF, PDF to Images, Page Numbers, and Watermark PDF.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'All Tools', path: '/tools' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-[#F4F7FB] pb-16">
      <SeoMeta
        title="All 13 PDF Tools – Merge, Compress, OCR, Unlock & Edit PDFs Free | PDFQuick"
        description="Explore all 13 free in-browser PDF tools: Merge, Split, Compress, OCR PDF, Edit PDF Metadata, Unlock PDF, Rotate, Delete Pages, Reorder, Images to PDF, PDF to Images, Page Numbers, and Watermark PDF."
        path="/tools"
        schema={schema}
      />

      {/* Crisp Header Band */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
          <Breadcrumbs items={[{ label: 'All Tools' }]} />

          <div className="text-center pt-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F7FB] text-[#102A56] border border-[#E2E8F0] rounded-lg text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Complete Suite of 13 Client-Side Tools</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#102A56] tracking-tight mb-3">
              All PDFQuick Tools
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] mb-7">
              Built for US Letter, UK A4, and international PDF workflows. Every tool executes strictly inside your browser sandbox with zero file uploads.
            </p>

            {/* Search Bar & Category Filter */}
            <div className="max-w-xl mx-auto space-y-3">
              <div className="relative">
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

              <div className="flex flex-wrap items-center justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-[#102A56] text-white border-[#102A56]'
                        : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#102A56]'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {filteredTools.length === 0 && matchedBankingServices.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center max-w-xl mx-auto mb-12">
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
          <>
            {matchedBankingServices.length > 0 && (
              <div className="mb-12">
                <div className="border-b border-[#E2E8F0] pb-2.5 mb-6 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    <h2 className="font-bold text-[#102A56] uppercase tracking-wider text-xs">
                      {t('tools.cat.banking')} ({matchedBankingServices.length})
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <Link to="/banking-finance" className="text-[#2563EB] hover:underline">
                      Open Banking Hub
                    </Link>
                    <Link to="/banking/us-banks" className="text-[#64748B] hover:text-[#2563EB]">
                      US Bank Guides
                    </Link>
                    <Link
                      to="/banking/financial-templates"
                      className="text-[#64748B] hover:text-[#2563EB]"
                    >
                      Financial Templates
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {matchedBankingServices.map((service) => {
                    const isPlanned = service.status === 'planned';
                    return (
                      <div
                        key={service.id}
                        className={`bg-white border rounded-2xl p-6 flex flex-col justify-between text-start ${
                          isPlanned
                            ? 'border-amber-200/80'
                            : 'border-[#E2E8F0] hover:border-[#2563EB] transition-colors'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-[#102A56] text-[#38BDF8] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                                {String(service.number).padStart(2, '0')}
                              </span>
                              <h3 className="text-base font-bold text-[#102A56]">
                                {service.name}
                              </h3>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${
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

                          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-3">
                            {service.shortDescription}
                          </p>

                          <ul className="space-y-1 text-[11px] text-[#64748B]">
                            {service.usUseCases.slice(0, 2).map((useCase) => (
                              <li key={useCase} className="flex items-start gap-1.5">
                                <span className="text-[#2563EB] font-bold">•</span>
                                <span>{useCase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                          <Link
                            to={service.primaryPath}
                            className={`inline-flex items-center gap-1.5 ${
                              isPlanned
                                ? 'text-amber-700 hover:text-amber-800'
                                : 'text-[#2563EB] hover:underline'
                            }`}
                          >
                            <span>
                              {isPlanned ? 'View Phase 2 Specification' : 'Launch Linked Tool'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {service.secondaryLinks && service.secondaryLinks.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {service.secondaryLinks.map((sec) => (
                                <Link
                                  key={sec.path}
                                  to={sec.path}
                                  className="text-[11px] text-[#64748B] hover:text-[#2563EB] underline-offset-2 hover:underline"
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
              </div>
            )}

            {renderCategorySection('Organize & Structure', organizeTools)}
            {renderCategorySection('Edit, Unlock, Number & Stamp', editTools)}
            {renderCategorySection('Optimize & Compress', optimizeTools)}
            {renderCategorySection('Convert & Export', convertTools)}
          </>
        )}

        {/* Feature Comparison & Decision Matrix (All 13 Tools) */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-10">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56] mb-2">
              PDFQuick Tool Comparison & Technical Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Compare all 13 client-side engines, supported US/UK paper geometries, and browser execution modes to choose the right utility:
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#102A56] text-white">
                  <th className="py-3 px-3.5 font-semibold">Tool</th>
                  <th className="py-3 px-3.5 font-semibold">Primary Use Case</th>
                  <th className="py-3 px-3.5 font-semibold">Supported Inputs</th>
                  <th className="py-3 px-3.5 font-semibold">Output Format</th>
                  <th className="py-3 px-3.5 font-semibold">Browser Execution Mechanics</th>
                  <th className="py-3 px-3.5 font-semibold">Key Constraints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#64748B]">
                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/merge-pdf" className="text-[#2563EB] hover:underline">
                      Merge PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Combining reports, invoices, legal exhibits, and tax packets into one document.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (2+ files)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Unified .pdf</td>
                  <td className="py-3.5 px-3.5">
                    Lossless page dictionary copy via{' '}
                    <code className="bg-[#F4F7FB] px-1.5 py-0.5 rounded text-[10px] border border-[#E2E8F0]">
                      pdf-lib
                    </code>
                    .
                  </td>
                  <td className="py-3.5 px-3.5">250 MB cumulative RAM cap; unlocked files only.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/split-pdf" className="text-[#2563EB] hover:underline">
                      Split PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Extracting specific ranges or bursting full packets into standalone PDFs.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf or .zip</td>
                  <td className="py-3.5 px-3.5">Page tree pruning & asynchronous JSZip packaging.</td>
                  <td className="py-3.5 px-3.5">Intervals must fall inside valid document bounds.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/rotate-pdf" className="text-[#2563EB] hover:underline">
                      Rotate PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Permanently fixing sideways landscape scans or upside-down signed pages.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single / Batch)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Rotated .pdf / .zip</td>
                  <td className="py-3.5 px-3.5">
                    Updates /Rotate catalog flag by 90°, 180°, or 270° losslessly.
                  </td>
                  <td className="py-3.5 px-3.5">Angle steps in 90° increments; unlocked files only.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/delete-pdf-pages" className="text-[#2563EB] hover:underline">
                      Delete PDF Pages
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Removing blank scanner sheets, cover pages, or outdated appendices cleanly.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Pruned .pdf</td>
                  <td className="py-3.5 px-3.5">
                    Copies only kept page nodes into a clean fresh PDF catalog.
                  </td>
                  <td className="py-3.5 px-3.5">At least 1 page must remain in the final PDF.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/reorder-pdf-pages" className="text-[#2563EB] hover:underline">
                      Reorder PDF Pages
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Swapping page positions or reversing back-to-front duplex scanner stacks.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Reordered .pdf</td>
                  <td className="py-3.5 px-3.5">
                    Direct 1-based index remapping via lossless copyPages.
                  </td>
                  <td className="py-3.5 px-3.5">Accessible Up/Down controls preserve all vectors.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/add-page-numbers" className="text-[#2563EB] hover:underline">
                      Add Page Numbers
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Paginating US Letter/UK A4 legal briefs, theses, and exhibit packets.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single / Batch)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Numbered .pdf / .zip</td>
                  <td className="py-3.5 px-3.5">
                    CropBox-aware positioning embedding Standard Helvetica fonts.
                  </td>
                  <td className="py-3.5 px-3.5">Optional cover-page skip & custom start integer.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/watermark-pdf" className="text-[#2563EB] hover:underline">
                      Watermark PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Stamping CONFIDENTIAL, DRAFT, or COPY notices across contracts and proofs.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single / Batch)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Stamped .pdf / .zip</td>
                  <td className="py-3.5 px-3.5">
                    Vector HelveticaBold alpha compositing with auto-fit width scaling.
                  </td>
                  <td className="py-3.5 px-3.5">
                    Supports up to 80 characters; diagonal, center, or tiled.
                  </td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/compress-pdf" className="text-[#2563EB] hover:underline">
                      Compress PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Shrinking scanner files for email limits and US/UK e-filing portals.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single / Batch)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Optimized .pdf / .zip</td>
                  <td className="py-3.5 px-3.5">
                    Lossless stream deduplication or 140/100 DPI canvas raster downsampling.
                  </td>
                  <td className="py-3.5 px-3.5">
                    Pure vector text PDFs see smaller gains than raw scans.
                  </td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/images-to-pdf" className="text-[#2563EB] hover:underline">
                      Images to PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Turning photos of receipts, IDs, or whiteboards into US Letter / A4 PDFs.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.jpg, .png, .webp</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Multi-page .pdf</td>
                  <td className="py-3.5 px-3.5">
                    Off-screen HTML5 canvas buffer normalization into clean PDF pages.
                  </td>
                  <td className="py-3.5 px-3.5">250 MB cumulative upload cap across queued photos.</td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/pdf-to-images" className="text-[#2563EB] hover:underline">
                      PDF to Images
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Rendering PDF pages or slides as high-DPI PNG or JPEG pictures.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single / Batch)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.png / .jpg / .zip</td>
                  <td className="py-3.5 px-3.5">
                    PDF.js Web Worker rasterization onto HTML5 Canvas (1.5x–3.0x).
                  </td>
                  <td className="py-3.5 px-3.5">
                    High-DPI rendering buffers are released immediately per page.
                  </td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/ocr-pdf" className="text-[#2563EB] hover:underline">
                      OCR PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Recognizing text in scanned PDFs and embedding searchable layers.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Searchable .pdf / .txt</td>
                  <td className="py-3.5 px-3.5">
                    Lazy single-worker Tesseract.js LSTM WASM + hybrid text-layer check.
                  </td>
                  <td className="py-3.5 px-3.5">
                    Language traineddata cached locally in IndexedDB on first run.
                  </td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/edit-pdf-metadata" className="text-[#2563EB] hover:underline">
                      Edit PDF Metadata
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Updating or clearing Title, Author, Creation Date, and document properties.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Updated .pdf</td>
                  <td className="py-3.5 px-3.5">
                    pdf-lib Info dictionary rewriting + optional XMP catalog removal.
                  </td>
                  <td className="py-3.5 px-3.5">
                    Preserves vector pages &amp; layout losslessly; rejects encrypted PDFs.
                  </td>
                </tr>

                <tr className="hover:bg-[#F4F7FB] transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#102A56]">
                    <Link to="/unlock-pdf" className="text-[#2563EB] hover:underline">
                      Unlock PDF
                    </Link>
                  </td>
                  <td className="py-3.5 px-3.5">
                    Removing open passwords and owner printing/copying restrictions locally.
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">.pdf (Single)</td>
                  <td className="py-3.5 px-3.5 font-mono text-[11px]">Unlocked .pdf</td>
                  <td className="py-3.5 px-3.5">
                    WebAssembly qpdf decryption inside isolated browser Web Worker.
                  </td>
                  <td className="py-3.5 px-3.5">
                    Requires valid user/owner password if open-locked; supports AES-256/128 &amp; RC4.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Practical Workflow & Decision Guides */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-10">
          <h2 className="text-lg sm:text-xl font-bold text-[#102A56] mb-5">
            Practical PDF Workflows for US, UK & Global Teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm text-[#64748B] leading-relaxed">
            <div className="p-5 bg-[#F4F7FB] rounded-xl border border-[#E2E8F0]">
              <h3 className="font-bold text-[#102A56] text-sm mb-2">
                US Letter, UK A4 & Court Packet Assembly
              </h3>
              <p>
                Assemble loose scans with <strong className="text-[#17243A]">Merge PDF</strong>, fix sideways forms with{' '}
                <strong className="text-[#17243A]">Rotate PDF</strong>, strip blank separator sheets via{' '}
                <strong className="text-[#17243A]">Delete PDF Pages</strong>, and apply court-ready headers or footers with{' '}
                <strong className="text-[#17243A]">Add Page Numbers</strong> before filing.
              </p>
            </div>

            <div className="p-5 bg-[#F4F7FB] rounded-xl border border-[#E2E8F0]">
              <h3 className="font-bold text-[#102A56] text-sm mb-2">
                Draft Review & Confidentiality Stamping
              </h3>
              <p>
                Before circulating contracts, financial statements, or board decks externally, apply a{' '}
                <strong className="text-[#17243A]">Watermark PDF</strong> overlay (&ldquo;CONFIDENTIAL&rdquo; or &ldquo;DRAFT&rdquo;) in your browser so sensitive unencrypted copies never pass through remote APIs.
              </p>
            </div>

            <div className="p-5 bg-[#F4F7FB] rounded-xl border border-[#E2E8F0]">
              <h3 className="font-bold text-[#102A56] text-sm mb-2">
                Scanner Cleanup & Size Optimization
              </h3>
              <p>
                Fix backward batch-feeder scans with one-click reversal in{' '}
                <strong className="text-[#17243A]">Reorder PDF Pages</strong>, then shrink scanned images with{' '}
                <strong className="text-[#17243A]">Compress PDF</strong> to fit email limits and government portal upload caps.
              </p>
            </div>
          </div>
        </section>

        {/* Advertising Placement - Safely Buffered Below Editorial Content */}
        <div className="my-10 py-2 px-2 sm:px-10">
          <AdPlaceholder />
        </div>
      </div>
    </div>
  );
};
