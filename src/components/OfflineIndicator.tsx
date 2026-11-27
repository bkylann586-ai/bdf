import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../lib/pwa';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-xl bg-[#102A56] border border-[#38BDF8]/30 px-3.5 py-2.5 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
      <span>Offline Mode — Local PDF tools remain ready from browser cache.</span>
    </div>
  );
};
