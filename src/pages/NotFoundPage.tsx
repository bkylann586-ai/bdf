import React from 'react';
import { FileQuestion, ArrowRight, Home } from 'lucide-react';
import { TOOLS } from '../lib/toolsCatalog';
import { SeoMeta } from '../components/SeoMeta';
import { Link } from '../components/Link';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 bg-white py-16 sm:py-24">
      <SeoMeta
        title="Page Not Found (404) | PDFQuick"
        description="The page you requested could not be found. Return to PDFQuick home or select one of our free online PDF tools."
        path="/404"
        noindex={true}
      />

      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          The link you followed may be broken or the page may have moved. You can return home or choose a tool below:
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors mb-10"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>

        <div className="border-t border-slate-200 pt-8 text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Available PDF Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOOLS.map((t) => (
              <Link
                key={t.id}
                to={t.path}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-900 hover:text-blue-700 flex items-center justify-between transition-colors"
              >
                <span>{t.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
