import React from 'react';
import { ArrowRight, Home } from 'lucide-react';
import { TOOLS } from '../lib/toolsCatalog';
import { SeoMeta } from '../components/SeoMeta';
import { Link } from '../components/Link';
import { NotFoundIllustration, ToolIcon } from '../components/illustrations/PdfIllustrations';
import { useTranslation, getLocalizedToolMeta } from '../lib/i18n';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 bg-pq-hero py-16 sm:py-24">
      <SeoMeta
        title="Page Not Found (404) | PDFQuick"
        description="The page you requested could not be found. Return to PDFQuick home or select one of our free online PDF tools."
        path="/404"
        noindex={true}
      />

      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="pq-card p-6 sm:p-10">
          <NotFoundIllustration className="mb-6" />

          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-2">
            Page Not Found
          </h1>
          <p className="text-sm text-[#64748B] mb-8 leading-relaxed max-w-md mx-auto">
            The link you followed may be broken or the page may have moved. You can return home or choose a tool below:
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 min-h-[44px] text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] rounded-xl shadow-xs transition-all mb-10"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <div className="border-t border-[#E2E8F0] pt-8 text-start">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-4">
              {t('nav.allTools')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.map((tool) => {
                const localized = getLocalizedToolMeta(tool, t);
                return (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className="group p-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ToolIcon name={tool.iconName} size="sm" />
                      <span className="truncate">{localized.name}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
