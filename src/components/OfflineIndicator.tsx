import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../lib/pwa';
import { useTranslation } from '../lib/i18n';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 start-4 z-50 inline-flex items-center gap-2 rounded-xl bg-[#0F172A] border border-[#10B981]/40 px-3.5 py-2.5 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
      <span>{t('offline.banner')}</span>
    </div>
  );
};
