import React, { useId } from 'react';

interface BrandMarkProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 3D-layered geometric PDFQuick brand mark with vibrant Blue-to-Purple glossy sheet,
 * crisp white document bars, folded corner, and Emerald local-ready indicator.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const dimensions =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';

  const bodyStart = variant === 'dark' ? '#3B82F6' : '#2563EB';
  const bodyEnd = variant === 'dark' ? '#8B5CF6' : '#7C3AED';
  const backFill = variant === 'dark' ? '#1E3A8A' : '#102A56';

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${dimensions} shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="6" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={bodyStart} />
          <stop offset="100%" stopColor={bodyEnd} />
        </linearGradient>
        <linearGradient id={`${uid}-fold`} x1="23" y1="4" x2="31" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>

      {/* Soft depth sheet behind primary sheet */}
      <rect x="10" y="7" width="23" height="29" rx="5.5" fill={backFill} opacity="0.28" />

      {/* Main glossy 3D PDF sheet */}
      <path
        d="M7 7.5C7 5.567 8.567 4 10.5 4H23.2L31 11.8V32.5C31 34.433 29.433 36 27.5 36H10.5C8.567 36 7 34.433 7 32.5V7.5Z"
        fill={`url(#${uid}-body)`}
      />

      {/* Top specular highlight */}
      <path
        d="M10.5 4.8H22.8L30.2 12.2V13.5C30.2 12.8 29.8 12.2 29.3 11.7L23.2 5.6H10.5C9 5.6 7.8 6.8 7.8 8.3V7.5C7.8 6 9 4.8 10.5 4.8Z"
        fill="#FFFFFF"
        opacity="0.35"
      />

      {/* Folded corner */}
      <path d="M23.2 4L31 11.8H25.2C24.0954 11.8 23.2 10.9046 23.2 9.8V4Z" fill={`url(#${uid}-fold)`} />

      {/* Document action bars */}
      <rect x="11.5" y="15.5" width="13.5" height="2.6" rx="1.3" fill="#FFFFFF" />
      <rect x="11.5" y="20.6" width="10" height="2.6" rx="1.3" fill="#DBEAFE" />
      <rect x="11.5" y="25.7" width="14" height="2.6" rx="1.3" fill="#FFFFFF" opacity="0.88" />

      {/* Emerald precision corner badge */}
      <circle cx="30" cy="30.5" r="5.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.8" />
      <path
        d="M27.8 30.5L29.3 32L32.4 28.9"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
