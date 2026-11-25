import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(Boolean(isStandalone));

    const userAgent = window.navigator?.userAgent?.toLowerCase() || '';
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

const SW_UPDATE_EVENT = 'pdfquick:sw-update-state';
let swUpdateApplyFn: (() => Promise<void>) | null = null;
let swUpdateDismissed = false;
let swIsUpdating = false;

function emitSwUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT));
  }
}

export function notifySwUpdateAvailable(applyFn: () => Promise<void>): void {
  swUpdateApplyFn = applyFn;
  swUpdateDismissed = false;
  swIsUpdating = false;
  emitSwUpdateEvent();
}

export async function applySwUpdate(): Promise<void> {
  if (!swUpdateApplyFn || swIsUpdating) return;
  swIsUpdating = true;
  emitSwUpdateEvent();
  try {
    await swUpdateApplyFn();
  } catch {
    swIsUpdating = false;
    emitSwUpdateEvent();
  }
}

export function dismissSwUpdate(): void {
  swUpdateDismissed = true;
  emitSwUpdateEvent();
}

export function useSwUpdatePrompt() {
  const [state, setState] = useState({
    updateAvailable: false,
    isUpdating: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      setState({
        updateAvailable: Boolean(swUpdateApplyFn) && !swUpdateDismissed,
        isUpdating: swIsUpdating,
      });
    };
    sync();
    window.addEventListener(SW_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener(SW_UPDATE_EVENT, sync);
    };
  }, []);

  return state;
}
