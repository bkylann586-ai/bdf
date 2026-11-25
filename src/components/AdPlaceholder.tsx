import React, { useEffect, useRef } from 'react';
import { getSiteConfig } from '../lib/siteConfig';

interface AdPlaceholderProps {
  className?: string;
  format?: 'horizontal' | 'rectangle';
  adSlot?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  className = '',
  format = 'horizontal',
  adSlot,
}) => {
  const { adsense } = getSiteConfig();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adsense.isConfigured || !adsense.clientId || !adSlot || pushedRef.current) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // Ignore AdSense initialization errors if blocked or deferred by CMP
    }
  }, [adsense.isConfigured, adsense.clientId, adSlot]);

  // Do not render empty placeholder boxes before AdSense is approved and enabled by the owner
  if (!adsense.isConfigured || !adsense.clientId) {
    return null;
  }

  return (
    <aside
      className={`my-10 mx-auto w-full max-w-4xl border border-slate-200 bg-slate-50/60 rounded-xl p-4 flex flex-col items-center justify-center text-center ${
        format === 'horizontal' ? 'min-h-[100px]' : 'min-h-[250px]'
      } ${className}`}
      aria-label="Advertisement"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Advertisement
      </span>
      {adSlot ? (
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={adsense.clientId}
          data-ad-slot={adSlot}
          data-ad-format={format === 'horizontal' ? 'horizontal' : 'rectangle'}
          data-full-width-responsive="true"
        />
      ) : null}
    </aside>
  );
};
