import React from 'react';

interface BrandMarkProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Geometric PDFQuick brand mark: Deep Navy document body, Electric Blue action fold,
 * and Bright Cyan precision corner accent. Bundled inline for instant offline rendering.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
}) => {
  const dimensions =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';

  const bodyFill = variant === 'dark' ? '#1A3C75' : '#102A56';
  const borderStroke = variant === 'dark' ? '#38BDF8' : '#102A56';

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${dimensions} shrink-0 ${className}`}
    >
      {/* Document frame with cropped top-right fold */}
      <path
        d="M7 5C7 3.89543 7.89543 3 9 3H22.5L29 9.5V31C29 32.1046 28.1046 33 27 33H9C7.89543 33 7 32.1046 7 31V5Z"
        fill={bodyFill}
        stroke={borderStroke}
        strokeWidth="1.2"
      />
      {/* Precision cyan corner fold */}
      <path d="M22.5 3L29 9.5H24C23.1716 9.5 22.5 8.82843 22.5 8V3Z" fill="#38BDF8" />
      {/* Precision document action bars */}
      <rect x="11.5" y="13.5" width="13" height="2.4" rx="1.2" fill="#FFFFFF" />
      <rect x="11.5" y="18.5" width="9.5" height="2.4" rx="1.2" fill="#38BDF8" />
      <rect x="11.5" y="23.5" width="13" height="2.4" rx="1.2" fill="#2563EB" />
      {/* Bright blue accent highlight badge */}
      <circle cx="24" cy="24.7" r="2.1" fill="#38BDF8" />
    </svg>
  );
};
