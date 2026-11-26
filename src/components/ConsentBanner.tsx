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
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg p-4 text-slate-800"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-900">{copy.title}</h2>
            <button
              type="button"
              onClick={handleDecline}
              aria-label={copy.decline}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{copy.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {copy.accept}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copy.decline}
            </button>
            <Link
              to="/privacy#consent-settings"
              className="text-[11px] font-medium text-blue-600 hover:underline ms-auto"
            >
              {copy.settings}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};
