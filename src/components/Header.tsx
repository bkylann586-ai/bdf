import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Menu, X, ArrowRight, Globe, Check, ChevronDown } from 'lucide-react';
import { Link } from './Link';
import { BrandMark } from './BrandMark';
import { ToolIcon } from './illustrations/PdfIllustrations';
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
    { label: t('nav.merge'), href: '/merge-pdf' },
    { label: t('nav.split'), href: '/split-pdf' },
    { label: t('nav.compress'), href: '/compress-pdf' },
    { label: t('nav.imagesToPdf'), href: '/images-to-pdf' },
    { label: t('nav.bankingFinance'), href: '/banking-finance' },
  ];

  const moreToolLinks = [
    { label: t('nav.pdfToImages'), href: '/pdf-to-images', iconName: 'FileImage' },
    { label: t('nav.rotate'), href: '/rotate-pdf', iconName: 'RotateCw' },
    { label: t('nav.deletePages'), href: '/delete-pdf-pages', iconName: 'FileMinus' },
    { label: t('nav.reorderPages'), href: '/reorder-pdf-pages', iconName: 'ArrowUpDown' },
    { label: t('nav.pageNumbers'), href: '/add-page-numbers', iconName: 'Hash' },
    { label: t('nav.watermark'), href: '/watermark-pdf', iconName: 'Stamp' },
    { label: t('nav.ocrPdf'), href: '/ocr-pdf', iconName: 'ScanText' },
    { label: t('nav.editMetadata'), href: '/edit-pdf-metadata', iconName: 'FilePenLine' },
    { label: t('nav.unlockPdf'), href: '/unlock-pdf', iconName: 'Unlock' },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#0F172A] hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0 group"
          >
            <BrandMark variant="light" size="md" className="transition-transform duration-150 group-hover:scale-[1.04]" />
            <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">
              PDF<span className="text-[#2563EB]">Quick</span>
            </span>
          </Link>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs xl:text-sm font-semibold text-[#475569]">
            {navLinks.map((link) => {
              const isActive =
                currentPath === link.href ||
                (link.href === '/banking-finance' && currentPath.startsWith('/banking/'));
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 ${
                    isActive
                      ? 'text-[#2563EB] border-[#2563EB]'
                      : 'border-transparent hover:border-[#CBD5E1]'
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
                className={`inline-flex items-center gap-1 hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                  isMoreToolActive
                    ? 'text-[#2563EB] border-[#2563EB]'
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
                  className="absolute start-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_16px_38px_rgba(15,23,42,0.1)] p-1.5 z-50"
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
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors group ${
                          isItemActive
                            ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                            : 'text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#2563EB] font-medium'
                        }`}
                      >
                        <ToolIcon name={item.iconName} size="sm" className="w-7 h-7" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />

            {/* Language Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
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
                  className="absolute end-0 mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_14px_32px_rgba(15,23,42,0.1)] py-1.5 z-50"
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
                            ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                            : 'text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#2563EB]'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono font-bold text-[#102A56]">
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

            {/* Privacy Link on xl+ screens */}
            <div className="hidden xl:flex items-center">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-[#065F46] hover:text-[#047857] bg-[#ECFDF5] hover:bg-[#D1FAE5]/70 border border-[#A7F3D0] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>{t('header.privacyBadge')}</span>
              </Link>
            </div>

            {/* Mobile hamburger button (>= 44px tap target) */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center w-11 h-11 text-[#0F172A] hover:text-[#2563EB] rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
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
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-2 shadow-[0_14px_34px_rgba(15,23,42,0.1)] max-h-[82vh] overflow-y-auto">
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
                    className={`flex items-center justify-center gap-1.5 px-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#102A56]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-[11px] text-[#2563EB]">{lang.shortLabel}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#0F172A] hover:text-[#2563EB] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {moreToolLinks.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                      : 'text-[#0F172A] hover:text-[#2563EB] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <ToolIcon name={link.iconName} size="sm" className="w-7 h-7" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-1.5">
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center text-sm text-[#64748B] px-3 min-h-[40px] hover:text-[#0F172A]"
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center text-sm text-[#64748B] px-3 min-h-[40px] hover:text-[#0F172A]"
            >
              {t('nav.privacy')}
            </Link>
            <Link
              to="/tools"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 mt-2 px-4 min-h-[44px] text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-xl hover:opacity-95 transition-opacity"
            >
              <span>{t('nav.exploreTools')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
