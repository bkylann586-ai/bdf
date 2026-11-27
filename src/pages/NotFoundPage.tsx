import React from 'react';
import { ArrowRight, Home } from 'lucide-react';
import { TOOLS } from '../lib/toolsCatalog';
import { SeoMeta } from '../components/SeoMeta';
import { Link } from '../components/Link';
import { NotFoundIllustration } from '../components/illustrations/PdfIllustrations';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 bg-[#F4F7FB] py-16 sm:py-24">
      <SeoMeta
        title="Page Not Found (404) | PDFQuick"
        description="The page you requested could not be found. Return to PDFQuick home or select one of our free online PDF tools."
        path="/404"
        noindex={true}
      />

      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 shadow-[0_2px_10px_rgba(16,42,86,0.05)]">
          <NotFoundIllustration className="mb-6" />

          <h1 className="text-3xl font-extrabold text-[#102A56] tracking-tight mb-2">
            Page Not Found
          </h1>
          <p className="text-sm text-[#64748B] mb-8 leading-relaxed max-w-md mx-auto">
            The link you followed may be broken or the page may have moved. You can return home or choose a tool below:
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 min-h-[44px] text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors mb-10"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <div className="border-t border-[#E2E8F0] pt-8 text-start">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-4">
              Available PDF Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.map((t) => (
                <Link
                  key={t.id}
                  to={t.path}
                  className="p-3 bg-[#F4F7FB] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl text-xs font-semibold text-[#102A56] hover:text-[#2563EB] flex items-center justify-between transition-colors"
                >
                  <span>{t.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
