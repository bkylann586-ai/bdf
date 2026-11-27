import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../lib/pwa';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        aria-label="Install PDFQuick app for offline use"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-semibold text-[#17243A] bg-[#F4F7FB] hover:bg-[#E2E8F0]/60 border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          aria-label="How to install PDFQuick on iOS"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A56]/50 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 id="ios-install-title" className="text-base font-bold text-[#102A56]">
                  Install PDFQuick Offline
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation instructions"
                  className="p-1.5 text-[#64748B] hover:text-[#17243A] rounded-lg hover:bg-[#F4F7FB] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed space-y-1.5">
                <span className="block">1. Tap the <strong className="text-[#17243A]">Share</strong> icon in the Safari toolbar.</span>
                <span className="block">2. Scroll down and tap <strong className="text-[#17243A]">Add to Home Screen</strong>.</span>
                <span className="block">3. Launch PDFQuick anytime—even offline.</span>
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] min-h-[42px] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
