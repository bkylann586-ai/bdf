import React from 'react';

interface AdPlaceholderProps {
  className?: string;
  format?: 'horizontal' | 'rectangle';
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  className = '',
  format = 'horizontal',
}) => {
  return (
    <aside
      className={`my-10 mx-auto w-full max-w-4xl border border-dashed border-slate-300 bg-slate-50/80 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${
        format === 'horizontal' ? 'min-h-[110px]' : 'min-h-[260px]'
      } ${className}`}
      aria-label="Sponsorship & Advertisement Space"
    >
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/70 text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
        <span>Advertisement</span>
      </div>
      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
        Reserved for non-intrusive sponsor messaging. Placed below instructional guides to ensure complete visual separation from document upload and download controls.
      </p>
    </aside>
  );
};
