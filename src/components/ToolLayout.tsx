import React from 'react';
import { ShieldCheck, ChevronRight, HelpCircle, BookOpen, Cpu } from 'lucide-react';
import { ToolMeta } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { AdPlaceholder } from './AdPlaceholder';
import { SeoMeta, getProductionBaseUrl } from './SeoMeta';
import { TOOLS } from '../lib/toolsCatalog';
import { Link } from './Link';
import { ToolIcon } from './illustrations/PdfIllustrations';
import { useTranslation } from '../lib/i18n';

interface ToolLayoutProps {
  tool: ToolMeta;
  children: React.ReactNode;
  howToSteps: { step: string; title: string; description: string }[];
  technicalDetails: { title: string; content: string }[];
  faqs: { question: string; answer: string }[];
  technicalIntro?: string;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  children,
  howToSteps,
  technicalDetails,
  faqs,
  technicalIntro,
}) => {
  const { t } = useTranslation();
  const others = TOOLS.filter((item) => item.id !== tool.id);
  const sameCategory = others.filter((item) => item.category === tool.category);
  const otherCategories = others.filter((item) => item.category !== tool.category);
  const relatedTools = [...sameCategory, ...otherCategories].slice(0, 4);
  const baseUrl = getProductionBaseUrl();
  const toolCanonicalUrl = `${baseUrl}/${tool.id}`;

  const schemaGraph: any[] = [
    {
      '@type': 'WebApplication',
      '@id': `${toolCanonicalUrl}#webapp`,
      name: `${tool.name} – PDFQuick`,
      url: toolCanonicalUrl,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All web browsers',
      browserRequirements: 'Requires modern web browser with HTML5 and JavaScript enabled.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: tool.metaDescription,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${toolCanonicalUrl}#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${baseUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tools',
          item: `${baseUrl}/tools`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: tool.name,
          item: toolCanonicalUrl,
        },
      ],
    },
  ];

  if (howToSteps && howToSteps.length > 0) {
    schemaGraph.push({
      '@type': 'HowTo',
      '@id': `${toolCanonicalUrl}#howto`,
      name: `How to Use ${tool.name}`,
      description: tool.tagline,
      step: howToSteps.map((s, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: s.title,
        text: s.description,
        url: `${toolCanonicalUrl}#step-${idx + 1}`,
      })),
    });
  }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': schemaGraph,
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-16">
      <SeoMeta
        title={tool.metaTitle}
        description={tool.metaDescription}
        path={`/${tool.id}`}
        schema={schema}
        faqs={faqs}
      />

      {/* Crisp Architectural Header Band */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-7 sm:pb-9">
          <Breadcrumbs
            items={[
              { label: 'Tools', href: '/tools' },
              { label: tool.name },
            ]}
          />

          <div className="text-center pt-3 sm:pt-5 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3.5">
              <ToolIcon name={tool.iconName} size="lg" tone="navy" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F7FB] text-[#102A56] border border-[#E2E8F0] rounded-lg text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{t('header.privacyBadge')}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#102A56] tracking-tight mb-3">
              {tool.name}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              {tool.tagline}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Interactive Tool Container */}
        <div className="max-w-4xl mx-auto mb-12">{children}</div>

        {/* Step-by-Step Guide (Separates Tool Controls from Ad Area) */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              How to Use {tool.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howToSteps.map((s, idx) => (
              <div
                key={idx}
                className="flex flex-col p-4 rounded-xl bg-[#F4F7FB]/70 border border-[#E2E8F0]"
              >
                <span className="w-7 h-7 rounded-lg bg-[#102A56] text-[#38BDF8] flex items-center justify-center text-xs font-bold font-mono mb-3">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-bold text-[#17243A] mb-1">{s.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Advertising Placement - Safely Buffered Below Workspace & Guide */}
        <div className="max-w-4xl mx-auto px-2 sm:px-10">
          <AdPlaceholder placement="tool-below-workspace" />
        </div>

        {/* Technical Details & In-Browser Limitations */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#102A56] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              Technical Specifications & Browser Execution
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#64748B] mb-6 leading-relaxed">
            {technicalIntro ||
              `PDFQuick executes all ${tool.name} operations directly in your browser using client-side JavaScript, HTML5 Canvas, and memory buffers without uploading files to remote servers:`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalDetails.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl"
              >
                <h3 className="text-xs font-bold text-[#102A56] mb-1.5">{item.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section
          id="faqs"
          className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(16,42,86,0.04)]"
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102A56]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                id={`faq-${idx + 1}`}
                className="pb-4 border-b border-[#E2E8F0] last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-bold text-[#17243A] mb-1.5">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Tools Navigation */}
        <section className="my-10 max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-[#102A56] mb-4">Related PDF Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => (
              <Link
                key={relTool.id}
                to={relTool.path}
                className="p-4 bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(16,42,86,0.06)] group flex flex-col justify-between"
              >
                <div>
                  <ToolIcon name={relTool.iconName} size="sm" className="mb-3" />
                  <h3 className="text-sm font-bold text-[#17243A] group-hover:text-[#2563EB] transition-colors mb-1">
                    {relTool.name}
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {relTool.shortDescription}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] mt-3">
                  <span>Open tool</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
