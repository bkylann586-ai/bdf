import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Link } from './Link';
import {
  getCmpIntegrationStatus,
  getSavedConsentState,
  saveConsentPreference,
  type ConsentState,
} from '../lib/consent';
import { useTranslation } from '../lib/i18n';
import { getSiteConfig } from '../lib/siteConfig';

const BANNER_COPY = {
  en: {
    title: 'Privacy & Advertising Consent',
    body: 'Your PDF files are processed 100% locally in your browser and never leave your device. Allow non-personalized advertising cookies/scripts to keep PDFQuick free?',
    accept: 'Accept',
    decline: 'Decline',
    settings: 'Privacy Settings',
  },
  ar: {
    title: 'الخصوصية وموافقة الإعلانات',
    body: 'تتم معالجة ملفات PDF محلياً بنسبة 100% داخل متصفحك ولا تغادر جهازك أبداً. هل توافق على تفعيل سكربتات الإعلانات غير المخصّصة لدعم استمرار الموقع مجاناً؟',
    accept: 'موافق',
    decline: 'رفض',
    settings: 'إعدادات الخصوصية',
  },
  es: {
    title: 'Privacidad y consentimiento publicitario',
    body: 'Tus archivos PDF se procesan 100% en tu navegador y nunca salen de tu dispositivo. ¿Aceptas anuncios no personalizados para mantener PDFQuick gratuito?',
    accept: 'Aceptar',
    decline: 'Rechazar',
    settings: 'Configuración',
  },
  fr: {
    title: 'Confidentialité et consentement publicitaire',
    body: 'Vos fichiers PDF sont traités à 100 % localement dans votre navigateur. Autoriser les annonces non personnalisées pour garder PDFQuick gratuit ?',
    accept: 'Accepter',
    decline: 'Refuser',
    settings: 'Paramètres',
  },
} as const;

export const ConsentBanner: React.FC = () => {
  const { language, dir } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const { adsense, monetag, cmp } = getSiteConfig();
    const requiresBanner =
      adsense.isConfigured || (monetag.isConfigured && monetag.requireConsent);
    if (!requiresBanner) {
      setVisible(false);
      return;
    }

    const cmpStatus = getCmpIntegrationStatus();
    if (cmp.isConfigured || cmpStatus.isExternalCmpActive) {
      setVisible(false);
      return;
    }

    const saved = getSavedConsentState();
    setVisible(saved.updatedAt === null);

    const handleConsentUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<ConsentState>).detail;
      if (detail && detail.updatedAt !== null) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    };

    window.addEventListener('pdfquick:consent-updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('pdfquick:consent-updated', handleConsentUpdate);
    };
  }, []);

  if (!visible) return null;

  const copy = BANNER_COPY[language] || BANNER_COPY.en;

  const handleAccept = () => {
    saveConsentPreference(
      {
        ad_storage: 'granted',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      },
      'user_preference'
    );
    setVisible(false);
  };

  const handleDecline = () => {
    saveConsentPreference(
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      },
      'user_preference'
    );
    setVisible(false);
  };

  return (
    <aside
      dir={dir}
      role="dialog"
      aria-label={copy.title}
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:max-w-md z-50 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl shadow-[0_12px_32px_rgba(16,42,86,0.12)] p-4 text-[#17243A]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-xl bg-[#F4F7FB] border border-[#E2E8F0] text-[#2563EB] shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-[#102A56]">{copy.title}</h2>
            <button
              type="button"
              onClick={handleDecline}
              aria-label={copy.decline}
              className="text-[#64748B] hover:text-[#17243A] p-1 rounded-lg hover:bg-[#F4F7FB] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-[#64748B] leading-relaxed">{copy.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {copy.accept}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="px-3.5 py-2 rounded-lg bg-[#F4F7FB] hover:bg-[#E2E8F0] text-[#17243A] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copy.decline}
            </button>
            <Link
              to="/privacy#consent-settings"
              className="text-[11px] font-semibold text-[#2563EB] hover:underline ms-auto"
            >
              {copy.settings}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};
