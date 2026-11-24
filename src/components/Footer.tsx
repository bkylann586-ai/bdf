import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import { TOOLS } from '../lib/toolsCatalog';
import { Link } from './Link';
import { useTranslation } from '../lib/i18n';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">PDFQuick</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t('footer.zeroStorage')}</span>
            </div>
          </div>

          {/* Tools Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              {t('footer.pdfTools')}
            </h4>
            <ul className="space-y-2">
              {TOOLS.map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.path} className="hover:text-white transition-colors text-xs">
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/tools" className="hover:text-white transition-colors text-xs text-blue-400">
                  {t('footer.viewAll')}
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <Link to="/banking-finance" className="hover:text-white transition-colors text-xs font-semibold text-emerald-400">
                  Banking & Finance Hub
                </Link>
              </li>
              <li>
                <Link to="/banking/us-banks" className="hover:text-white transition-colors text-xs">
                  US Bank Statement Guides
                </Link>
              </li>
              <li>
                <Link to="/banking/financial-pdf-form-filler" className="hover:text-white transition-colors text-xs">
                  Financial PDF Form Filler
                </Link>
              </li>
              <li>
                <Link to="/banking/financial-document-privacy" className="hover:text-white transition-colors text-xs">
                  Privacy &amp; Redaction Tools
                </Link>
              </li>
              <li>
                <Link to="/banking/financial-templates" className="hover:text-white transition-colors text-xs">
                  Financial Helper Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-white transition-colors text-xs">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors text-xs">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors text-xs">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-white transition-colors text-xs">
                  {t('footer.dmca')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors text-xs">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Browser Execution Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              {t('footer.browserNotice')}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.browserDetails')}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('footer.publicDeviceNotice')}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PDFQuick. {t('footer.allRights')}</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/dmca" className="hover:text-slate-400 transition-colors">DMCA</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
