import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Menu, X, ArrowRight, Globe, Check, ChevronDown } from 'lucide-react';
import { Link } from './Link';
import { BrandMark } from './BrandMark';
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#102A56] hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0 group"
          >
            <BrandMark variant="light" size="md" className="transition-transform duration-150 group-hover:scale-[1.03]" />
            <span className="text-xl font-extrabold tracking-tight text-[#102A56]">
              PDF<span className="text-[#2563EB]">Quick</span>
            </span>
          </Link>

          {/* Zone 2: Single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs xl:text-sm font-medium text-[#64748B]">
            {navLinks.map((link) => {
              const isActive =
                currentPath === link.href ||
                (link.href === '/banking-finance' && currentPath.startsWith('/banking/'));
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`hover:text-[#102A56] transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 ${
                    isActive
                      ? 'text-[#102A56] font-semibold border-[#2563EB]'
                      : 'border-transparent'
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
                className={`inline-flex items-center gap-1 hover:text-[#102A56] transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                  isMoreToolActive
                    ? 'text-[#102A56] font-semibold border-[#2563EB]'
                    : 'border-transparent'
                }`}
                aria-expanded={moreToolsOpen}
                aria-haspopup="true"
              >
                <span>{t('nav.moreTools')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    moreToolsOpen ? 'rotate-180 text-[#2563EB]' : ''
                  }`}
                />
              </button>

              {moreToolsOpen && (
                <div
                  className="absolute start-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_8px_24px_rgba(16,42,86,0.08)] py-1.5 z-50"
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
                            ? 'bg-[#F4F7FB] text-[#2563EB] font-semibold'
                            : 'text-[#17243A] hover:bg-[#F4F7FB] hover:text-[#102A56]'
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

            {/* Desktop Language Selector Dropdown (typographic ISO badge, no flag emoji clutter) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-semibold text-[#17243A] hover:text-[#102A56] bg-[#F4F7FB] hover:bg-[#E2E8F0]/60 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
                aria-expanded={langDropdownOpen}
                aria-haspopup="true"
                aria-label={t('header.language')}
              >
                <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-mono tracking-tight">{currentLangOption.shortLabel}</span>
                <ChevronDown
                  className={`w-3 h-3 text-[#64748B] transition-transform duration-150 ${
                    langDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div
                  className="absolute end-0 mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_8px_24px_rgba(16,42,86,0.08)] py-1.5 z-50"
                  role="menu"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    {t('header.language')}
                  </div>
                  {LANGUAGES.map((lang) => {
                    const isSelected = lang.code === language;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full text-start px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4F7FB] text-[#2563EB] font-bold'
                            : 'text-[#17243A] hover:bg-[#F4F7FB] hover:text-[#102A56]'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-5 rounded bg-white border border-[#E2E8F0] text-[10px] font-mono font-bold text-[#102A56]">
                            {lang.shortLabel}
                          </span>
                          <span>{lang.name}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy Trust Link (shown cleanly on xl viewports so nav stays single-line) */}
            <div className="hidden xl:flex items-center">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[#102A56] hover:text-[#2563EB] bg-[#F4F7FB] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{t('header.privacyBadge')}</span>
              </Link>
            </div>

            {/* Mobile hamburger button (>= 44px tap target) */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center w-11 h-11 text-[#17243A] hover:text-[#102A56] rounded-lg hover:bg-[#F4F7FB] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-2 shadow-[0_10px_30px_rgba(16,42,86,0.08)] max-h-[82vh] overflow-y-auto">
          {/* Mobile Language Switcher Row */}
          <div className="pb-3 mb-2 border-b border-[#E2E8F0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
              {t('header.language')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 min-h-[44px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#102A56]'
                        : 'bg-[#F4F7FB] border-[#E2E8F0] text-[#17243A] hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-[11px] text-[#2563EB]">{lang.shortLabel}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {[...navLinks, ...moreToolLinks].map((link) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#17243A] hover:text-[#2563EB] hover:bg-[#F4F7FB]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-1.5">
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center text-sm text-[#64748B] px-3 min-h-[40px] hover:text-[#102A56]"
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center text-sm text-[#64748B] px-3 min-h-[40px] hover:text-[#102A56]"
            >
              {t('nav.privacy')}
            </Link>
            <Link
              to="/tools"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 mt-2 px-4 min-h-[44px] text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-[#1D4ED8] transition-colors"
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
