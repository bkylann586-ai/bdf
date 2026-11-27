import React from 'react';
import { ShieldCheck, ChevronRight, HelpCircle, BookOpen, Cpu } from 'lucide-react';
import { ToolMeta } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { AdPlaceholder } from './AdPlaceholder';
import { SeoMeta, getProductionBaseUrl } from './SeoMeta';
import { TOOLS } from '../lib/toolsCatalog';
import { Link } from './Link';
import { ToolIcon } from './illustrations/PdfIllustrations';
import { getLocalizedToolMeta, useTranslation } from '../lib/i18n';

interface ToolLayoutProps {
  tool: ToolMeta;
  children: React.ReactNode;
  howToSteps: { step: string; title: string; description: string }[];
  technicalDetails: { title: string; content: string }[];
  faqs: { question: string; answer: string }[];
  technicalIntro?: string;
}

const STEP_BADGE_CLASSES = [
  'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white',
  'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white',
  'bg-gradient-to-br from-[#10B981] to-[#059669] text-white',
];

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  children,
  howToSteps,
  technicalDetails,
  faqs,
  technicalIntro,
}) => {
  const { t } = useTranslation();
  const localizedTool = getLocalizedToolMeta(tool, t);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <SeoMeta
        title={tool.metaTitle}
        description={tool.metaDescription}
        path={`/${tool.id}`}
        schema={schema}
        faqs={faqs}
      />

      {/* Unified Light Gradient Header Band with 3D Tool Icon */}
      <div className="bg-pq-hero border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-7 sm:pb-9">
          <Breadcrumbs
            items={[
              { label: t('breadcrumbs.tools'), href: '/tools' },
              { label: localizedTool.name },
            ]}
          />

          <div className="text-center pt-3 sm:pt-5 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-3.5">
              <ToolIcon name={tool.iconName} size="xl" />
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#065F46]">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>{t('header.privacyBadge')}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-3">
              {localizedTool.name}
            </h1>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl mx-auto">
              {localizedTool.tagline}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Interactive Tool Container */}
        <div className="max-w-4xl mx-auto mb-12">{children}</div>

        {/* Step-by-Step Guide (Separates Tool Controls from Ad Area) */}
        <section className="pq-card p-6 sm:p-8 my-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              {t('toolLayout.howTo', { tool: localizedTool.name })}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {howToSteps.map((s, idx) => (
              <div
                key={idx}
                className="flex flex-col p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono tabular-nums mb-3 shadow-xs ${
                    STEP_BADGE_CLASSES[idx % STEP_BADGE_CLASSES.length]
                  }`}
                >
                  {idx + 1}
                </span>
                <h3 className="text-sm font-bold text-[#0F172A] mb-1">{s.title}</h3>
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
        <section className="pq-card p-6 sm:p-8 my-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] border border-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              {t('toolLayout.techTitle')}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#475569] mb-6 leading-relaxed">
            {technicalIntro || t('toolLayout.techIntro', { tool: localizedTool.name })}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalDetails.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl"
              >
                <h3 className="text-xs font-bold text-[#0F172A] mb-1.5">{item.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section
          id="faqs"
          className="pq-card p-6 sm:p-8 my-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] text-[#10B981] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
              {t('toolLayout.faqsTitle')}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                id={`faq-${idx + 1}`}
                className="pb-4 border-b border-[#E2E8F0] last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-bold text-[#0F172A] mb-1.5">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Tools Navigation */}
        <section className="my-10 max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-[#0F172A] mb-4">{t('toolLayout.relatedTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => {
              const relLocalized = getLocalizedToolMeta(relTool, t);
              return (
                <Link
                  key={relTool.id}
                  to={relTool.path}
                  className="p-4 bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-2xl pq-card-hover group flex flex-col justify-between"
                >
                  <div>
                    <ToolIcon name={relTool.iconName} size="md" className="mb-3" />
                    <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors mb-1">
                      {relLocalized.name}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                      {relLocalized.shortDescription}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] mt-3">
                    <span>{t('toolLayout.openTool')}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
