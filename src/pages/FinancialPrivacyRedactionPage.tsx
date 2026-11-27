import React, { useEffect } from 'react';
import { ShieldCheck, BookOpen, Cpu, HelpCircle } from 'lucide-react';
import { FinancialPrivacyRedactionTool } from '../components/tools/FinancialPrivacyRedactionTool';
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

const PRIVACY_REDACTION_FAQS: FaqSchemaItem[] = [
  {
    question: 'Why does true redaction flatten pages instead of drawing black boxes over text?',
    answer: 'Simply placing a black rectangle on a PDF leaves the original account numbers, SSNs, or text intact underneath so anyone can copy, paste, or search them. PDFQuick destructively clears the pixel buffer on redacted pages and discards original page text streams so removed content cannot be extracted.',
  },
  {
    question: 'What metadata and hidden structures are removed from the exported PDF?',
    answer: 'PDFQuick deletes the catalog XMP /Metadata stream, removes Info trailer keys (Author, Title, Subject, Keywords, Creator, Producer, Dates), and strips page annotations (/Annots), /AcroForm fields, /PieceInfo, /OCProperties layer dictionaries, and embedded scripts.',
  },
  {
    question: 'What happens to pages where I did not draw any redaction boxes?',
    answer: 'In Targeted Mode (default), untouched pages keep their exact page count and crisp vector layout with annotations and metadata stripped. If a source PDF may contain hidden layers or invisible OCR text on untouched pages, enable Deep-Flatten All Pages to convert every page to clean flattened images.',
  },
  {
    question: 'Does it work on both text-based bank PDFs and scanned image PDFs?',
    answer: 'Yes. You can draw manual blackout regions over both text PDFs and image/scanned PDFs, and on text-layer PDFs you can also auto-mark exact text matches directly on the page preview.',
  },
  {
    question: 'What happens if I upload a password-protected or encrypted bank PDF?',
    answer: 'Encrypted or owner-locked PDFs are cleanly rejected in browser memory rather than silently bypassing locks. Unlock your authorized copy locally via your viewer before redacting.',
  },
];

export const FinancialPrivacyRedactionPage: React.FC = () => {
  const { t } = useTranslation();
  const baseUrl = getProductionBaseUrl();
  const canonicalUrl = `${baseUrl}/banking/financial-document-privacy`;

  useEffect(() => {
    return injectFaqSchema(PRIVACY_REDACTION_FAQS, {
      toolId: 'financial-document-privacy',
      pageUrl: canonicalUrl,
    });
  }, [canonicalUrl]);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#webapp`,
        name: 'Financial Document Privacy & Redaction – PDFQuick',
        url: canonicalUrl,
        applicationCategory: 'SecurityApplication',
        operatingSystem: 'All web browsers',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description:
          'True client-side PDF redaction and Metadata/XMP scrubbing. Visually preview pages, destructively remove sensitive areas without leaving selectable text underneath, and inspect Before vs After results.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Banking & Finance', path: '/banking-finance' },
          { name: 'Financial Document Privacy & Redaction', path: '/banking/financial-document-privacy' },
        ],
        baseUrl
      ),
      {
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        name: 'How True PDF Redaction & Metadata Scrubbing Work',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Inspect & Mark Regions',
            text: 'Review detected Info/XMP metadata, navigate pages, and drag rectangles over sensitive numbers or auto-locate text matches.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Destructive Rebuild',
            text: 'Marked pages are rendered, pixels under blackout boxes are permanently cleared, and a fresh PDF catalog without XMP/Info/Annots is rebuilt.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Verify Before & After',
            text: 'Inspect side-by-side Before/After previews and automated verification confirming zero extractable text remains on redacted pages.',
          },
        ],
      },
    ],
  };

  return (
    <div className="flex-1 bg-[#F4F7FB] pb-16">
      <SeoMeta
        title="Financial Document Privacy & True PDF Redaction Tool | PDFQuick"
        description="Permanently redact sensitive areas on bank statements and scrub Author, Title, Creator, Annotations, and XMP Metadata strictly in your browser—no black-box text tricks."
        path="/banking/financial-document-privacy"
        schema={schema}
        faqs={PRIVACY_REDACTION_FAQS}
      />

      {/* Architectural Header Band matching ToolLayout */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
          <Breadcrumbs
            items={[
              { label: 'Banking & Finance', href: '/banking-finance' },
              { label: 'Financial Document Privacy & Redaction' },
            ]}
          />

          <div className="text-center pt-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3.5">
              <ToolIcon name="PrivacyRedact" size="lg" tone="navy" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F7FB] text-[#102A56] border border-[#E2E8F0] rounded-lg text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{t('header.privacyBadge')}</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#102A56] tracking-tight mb-3">
              {t('banking.privacyTitle')}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Preview multi-page financial PDFs, mark sensitive regions visually or by text match, permanently destroy underlying content via pixel flattening, scrub Metadata/XMP, and verify Before vs After output in browser RAM.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Interactive Redaction Tool Container */}
        <div className="mb-12">
          <FinancialPrivacyRedactionTool />
        </div>

        {/* How To Use */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              How True PDF Redaction &amp; Metadata Scrubbing Work
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#64748B] leading-relaxed">
            <div className="p-4 rounded-xl bg-[#F4F7FB]/70 border border-[#E2E8F0]">
              <span className="w-7 h-7 rounded-lg bg-[#102A56] text-[#38BDF8] flex items-center justify-center text-xs font-bold font-mono mb-3">
                1
              </span>
              <h3 className="text-sm font-bold text-[#17243A] mb-1">Inspect &amp; Mark Regions</h3>
              <p>Review detected Info/XMP metadata, navigate pages, and drag rectangles over sensitive numbers or auto-locate text matches.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F7FB]/70 border border-[#E2E8F0]">
              <span className="w-7 h-7 rounded-lg bg-[#102A56] text-[#38BDF8] flex items-center justify-center text-xs font-bold font-mono mb-3">
                2
              </span>
              <h3 className="text-sm font-bold text-[#17243A] mb-1">Destructive Rebuild</h3>
              <p>Marked pages are rendered, pixels under blackout boxes are permanently cleared, and a fresh PDF catalog without XMP/Info/Annots is rebuilt.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F7FB]/70 border border-[#E2E8F0]">
              <span className="w-7 h-7 rounded-lg bg-[#102A56] text-[#38BDF8] flex items-center justify-center text-xs font-bold font-mono mb-3">
                3
              </span>
              <h3 className="text-sm font-bold text-[#17243A] mb-1">Verify Before &amp; After</h3>
              <p>Inspect side-by-side Before/After previews and automated verification confirming zero extractable text remains on redacted pages.</p>
            </div>
          </div>
        </section>

        {/* Ad Buffer (>= 40px vertical & horizontal clearance) */}
        <div className="max-w-4xl mx-auto my-10 py-2 px-2 sm:px-10">
          <AdPlaceholder />
        </div>

        {/* Technical Limitations & Honest Disclosure */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#102A56] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              Honest Technical Boundaries
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#64748B] leading-relaxed">
            <div className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <h3 className="font-bold text-[#17243A] mb-1">Destructive Pixel Flattening</h3>
              <p>Because redacted pages become flattened raster images inside the rebuilt PDF, underlying glyphs in those pages are destroyed—trade-off is that text selection is removed on flattened pages.</p>
            </div>
            <div className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl">
              <h3 className="font-bold text-[#17243A] mb-1">Targeted vs Deep-Flatten</h3>
              <p>If untouched pages remain in Targeted Mode, automated warnings remind you that unredacted streams stayed intact unless you select Deep-Flatten All Pages.</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-4 text-xs font-semibold">
            <Link to="/delete-pdf-pages" className="text-[#2563EB] hover:underline">
              Remove Whole Sensitive Pages (Delete PDF Pages) →
            </Link>
            <Link to="/banking/financial-pdf-form-filler" className="text-[#2563EB] hover:underline">
              Prepare Helper Worksheets (Financial Form Filler) →
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
            {PRIVACY_REDACTION_FAQS.map((faq, idx) => (
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
