import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { applySwUpdate, dismissSwUpdate, useSwUpdatePrompt } from '../lib/pwa';

export const SwUpdatePrompt: React.FC = () => {
  const { updateAvailable, isUpdating } = useSwUpdatePrompt();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-xs text-white shadow-xl max-w-sm"
    >
      <div className="flex-1">
        <p className="font-semibold text-white">App update ready</p>
        <p className="text-slate-300 mt-0.5">
          Refresh when ready to apply the latest version. Your current files will clear on reload.
        </p>
      </div>
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => {
          void applySwUpdate();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 py-1.5 font-semibold text-white transition-colors shrink-0 cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
        <span>{isUpdating ? 'Updating...' : 'Refresh'}</span>
      </button>
      <button
        type="button"
        aria-label="Dismiss update notification"
        onClick={dismissSwUpdate}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
