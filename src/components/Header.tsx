import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Menu, X, FileText, ArrowRight, Globe, Check, ChevronDown } from 'lucide-react';
import { Link } from './Link';
import { PWAInstallButton } from './PWAInstallButton';
import { useTranslation, LANGUAGES, SupportedLanguage } from '../lib/i18n';

interface HeaderProps {
  currentPath: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPath }) => {
  const { t, language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreToolsRef = useRef<HTMLDivElement>(null);

  const currentLangOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const navLinks = [
    { label: t('nav.allTools'), href: '/tools' },
    { label: t('nav.bankingFinance'), href: '/banking-finance' },
    { label: t('nav.merge'), href: '/merge-pdf' },
    { label: t('nav.split'), href: '/split-pdf' },
    { label: t('nav.compress'), href: '/compress-pdf' },
    { label: t('nav.imagesToPdf'), href: '/images-to-pdf' },
    { label: t('nav.pdfToImages'), href: '/pdf-to-images' },
  ];

  const moreToolLinks = [
    { label: t('nav.rotate'), href: '/rotate-pdf' },
    { label: t('nav.deletePages'), href: '/delete-pdf-pages' },
    { label: t('nav.reorderPages'), href: '/reorder-pdf-pages' },
    { label: t('nav.pageNumbers'), href: '/add-page-numbers' },
    { label: t('nav.watermark'), href: '/watermark-pdf' },
    { label: t('nav.ocrPdf'), href: '/ocr-pdf' },
    { label: t('nav.editMetadata'), href: '/edit-pdf-metadata' },
    { label: t('nav.unlockPdf'), href: '/unlock-pdf' },
  ];

  const isMoreToolActive = moreToolLinks.some((item) => item.href === currentPath);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (moreToolsRef.current && !moreToolsRef.current.contains(event.target as Node)) {
        setMoreToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-900 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-blue-700 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              PDF<span className="text-blue-600">Quick</span>
            </span>
          </Link>

          {/* Zone 2: Single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs xl:text-sm font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive =
                currentPath === link.href ||
                (link.href === '/banking-finance' && currentPath.startsWith('/banking/'));
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                    isActive ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* More Tools Dropdown */}
            <div className="relative" ref={moreToolsRef}>
              <button
                type="button"
                onClick={() => setMoreToolsOpen(!moreToolsOpen)}
                className={`inline-flex items-center gap-1 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  isMoreToolActive ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
                }`}
                aria-expanded={moreToolsOpen}
                aria-haspopup="true"
              >
                <span>{t('nav.moreTools')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreToolsOpen && (
                <div
                  className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50"
                  role="menu"
                >
                  {moreToolLinks.map((item) => {
                    const isItemActive = currentPath === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreToolsOpen(false)}
                        role="menuitem"
                        className={`block px-3.5 py-2 text-xs transition-colors ${
                          isItemActive
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Actions - Install CTA, Language selector & Privacy badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />
            {/* Desktop Language Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                aria-expanded={langDropdownOpen}
                aria-haspopup="true"
                aria-label={t('header.language')}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-sm leading-none">{currentLangOption.flag}</span>
                <span className="font-mono">{currentLangOption.shortLabel}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('header.language')}
                  </div>
                  {LANGUAGES.map((lang) => {
                    const isSelected = lang.code === language;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy Trust Badge (shown cleanly on xl viewports so nav stays single-line) */}
            <div className="hidden xl:flex items-center">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('header.privacyBadge')}</span>
              </Link>
            </div>

            {/* Mobile hamburger button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg max-h-[80vh] overflow-y-auto">
          {/* Mobile Language Switcher Row */}
          <div className="pb-3 mb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {t('header.language')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                    }}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {[...navLinks, ...moreToolLinks].map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-slate-600 px-3 py-1 hover:text-slate-900"
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-slate-600 px-3 py-1 hover:text-slate-900"
            >
              {t('nav.privacy')}
            </Link>
            <Link
              to="/tools"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 mt-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <span>{t('nav.exploreTools')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
