import React from 'react';
import { ShieldCheck, ChevronRight, HelpCircle, BookOpen, Cpu } from 'lucide-react';
import { ToolMeta } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { AdPlaceholder } from './AdPlaceholder';
import { SeoMeta, getProductionBaseUrl } from './SeoMeta';
import { TOOLS } from '../lib/toolsCatalog';
import { Link } from './Link';
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
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <SeoMeta
        title={tool.metaTitle}
        description={tool.metaDescription}
        path={`/${tool.id}`}
        schema={schema}
        faqs={faqs}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Tools', href: '/tools' },
            { label: tool.name },
          ]}
        />

        {/* Tool Header */}
        <div className="text-center py-6 sm:py-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('header.privacyBadge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {tool.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {tool.tagline}
          </p>
        </div>

        {/* Interactive Tool Container */}
        <div className="max-w-4xl mx-auto mb-12">
          {children}
        </div>

        {/* Step-by-Step Guide (Separates Tool Controls from Ad Area) */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              How to Use {tool.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howToSteps.map((s, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono mb-3">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Advertising Placement - Safely Buffered Below Educational Content (min >= 40px separation) */}
        <div className="max-w-4xl mx-auto my-10 py-2 px-2 sm:px-10">
          <AdPlaceholder />
        </div>

        {/* Technical Details & In-Browser Limitations */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Technical Specifications & Browser Execution
            </h2>
          </div>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            {technicalIntro ||
              `PDFQuick executes all ${tool.name} operations directly in your browser using client-side JavaScript, HTML5 Canvas, and memory buffers without uploading files to remote servers:`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalDetails.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section
          id="faqs"
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 my-8 max-w-4xl mx-auto shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                id={`faq-${idx + 1}`}
                className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  {faq.question}
                </h3>
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Tools Navigation */}
        <section className="my-10 max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Related PDF Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => (
              <Link
                key={relTool.id}
                to={relTool.path}
                className="p-4 bg-white border border-slate-200 hover:border-blue-400 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {relTool.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {relTool.shortDescription}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 mt-3">
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
