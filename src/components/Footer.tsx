import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { TOOLS } from '../lib/toolsCatalog';
import { Link } from './Link';
import { BrandMark } from './BrandMark';
import { getLocalizedToolMeta, useTranslation } from '../lib/i18n';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-b from-[#0F172A] to-[#102A56] text-slate-300 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white group">
              <BrandMark variant="dark" size="sm" />
              <span className="text-lg font-extrabold tracking-tight">
                PDF<span className="text-[#60A5FA]">Quick</span>
              </span>
            </Link>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#34D399] font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>{t('footer.zeroStorage')}</span>
            </div>
          </div>

          {/* Tools Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {t('footer.pdfTools')}
            </h4>
            <ul className="space-y-2">
              {TOOLS.map((tool) => {
                const localized = getLocalizedToolMeta(tool, t);
                return (
                  <li key={tool.id}>
                    <Link
                      to={tool.path}
                      className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                    >
                      {localized.name}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  to="/tools"
                  className="hover:text-white transition-colors text-xs font-semibold text-[#60A5FA]"
                >
                  {t('footer.viewAll')}
                </Link>
              </li>
              <li className="pt-2.5 border-t border-white/10">
                <Link
                  to="/banking-finance"
                  className="hover:text-white transition-colors text-xs font-semibold text-[#34D399]"
                >
                  {t('nav.bankingFinance')}
                </Link>
              </li>
              <li>
                <Link
                  to="/banking/us-banks"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  US Bank Statement Guides
                </Link>
              </li>
              <li>
                <Link
                  to="/banking/financial-pdf-form-filler"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('banking.formFillerTitle')}
                </Link>
              </li>
              <li>
                <Link
                  to="/banking/financial-document-privacy"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('banking.privacyTitle')}
                </Link>
              </li>
              <li>
                <Link
                  to="/banking/financial-templates"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  Financial Helper Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/dmca"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('footer.dmca')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#60A5FA] transition-colors text-xs text-slate-300"
                >
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Browser Execution Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('footer.browserNotice')}
            </h4>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              {t('footer.browserDetails')}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.publicDeviceNotice')}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300/80">
          <p>© {new Date().getFullYear()} PDFQuick. {t('footer.allRights')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy#consent-settings" className="hover:text-white transition-colors">
              Consent Settings
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/dmca" className="hover:text-white transition-colors">
              DMCA
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
