import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import type { PdfPreviewProps } from './PdfPreview';

const PdfPreviewComponent = lazy(() =>
  import('./PdfPreview').then((m) => ({ default: m.PdfPreview }))
);

export const LazyPdfPreview: React.FC<PdfPreviewProps> = (props) => {
  if (!props.file) return null;

  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          className="w-full border border-[#E2E8F0] rounded-2xl bg-[#F8FAFC] p-6 text-center flex items-center justify-center gap-2.5 text-xs font-medium text-[#64748B]"
        >
          <Loader2 className="w-4 h-4 animate-spin text-[#2563EB] shrink-0" />
          <span>Loading PDF page preview...</span>
        </div>
      }
    >
      <PdfPreviewComponent {...props} />
    </Suspense>
  );
};
