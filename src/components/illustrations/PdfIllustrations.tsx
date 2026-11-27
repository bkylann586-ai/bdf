import React, { useId } from 'react';

export type UnifiedToolIconName =
  | 'Layers'
  | 'Scissors'
  | 'RotateCw'
  | 'FileMinus'
  | 'ArrowUpDown'
  | 'Minimize2'
  | 'Image'
  | 'FileImage'
  | 'Hash'
  | 'Stamp'
  | 'ScanText'
  | 'FilePenLine'
  | 'Unlock'
  | 'FormFiller'
  | 'PrivacyRedact'
  | string;

export type ToolAccentTone = 'blue' | 'purple' | 'emerald' | 'amber';

export function getToolAccentTone(iconName: UnifiedToolIconName): ToolAccentTone {
  switch (iconName) {
    case 'Layers':
    case 'Scissors':
    case 'RotateCw':
    case 'FileMinus':
    case 'ArrowUpDown':
      return 'blue';
    case 'Hash':
    case 'Stamp':
    case 'FilePenLine':
    case 'Unlock':
    case 'PrivacyRedact':
      return 'purple';
    case 'Minimize2':
    case 'FormFiller':
      return 'emerald';
    case 'Image':
    case 'FileImage':
    case 'ScanText':
      return 'amber';
    default:
      return 'blue';
  }
}

interface ToolIconProps {
  name: UnifiedToolIconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'navy' | 'blue' | 'cyan' | 'emerald' | 'dark' | 'purple' | 'amber';
  className?: string;
}

const ACCENT_GRADIENTS: Record<ToolAccentTone, { start: string; end: string; glow: string; bg: string }> = {
  blue: { start: '#3B82F6', end: '#1D4ED8', glow: 'rgba(37, 99, 235, 0.18)', bg: '#EFF6FF' },
  purple: { start: '#8B5CF6', end: '#6D28D9', glow: 'rgba(124, 58, 237, 0.18)', bg: '#F5F3FF' },
  emerald: { start: '#34D399', end: '#059669', glow: 'rgba(16, 185, 129, 0.18)', bg: '#ECFDF5' },
  amber: { start: '#FBBF24', end: '#D97706', glow: 'rgba(245, 158, 11, 0.18)', bg: '#FFFBEB' },
};

/**
 * 15 distinct, high-craft 3D colorful SVG tool icons modeled after glossy 3D PDF
 * sheets with folded corners, red PDF tags, and semantic Blue / Purple / Emerald / Amber emblems.
 * Pure inline SVG (zero network calls, instant offline rendering, unique per-instance defs IDs).
 */
export const ToolIcon: React.FC<ToolIconProps> = ({
  name,
  size = 'md',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const accentTone = getToolAccentTone(name);
  const palette = ACCENT_GRADIENTS[accentTone];

  const sizeClass =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
        ? 'w-14 h-14'
        : size === 'xl'
          ? 'w-16 h-16'
          : 'w-11 h-11';

  const showPdfBadge = name !== 'Image';

  const render3DOverlayEmblem = () => {
    switch (name) {
      case 'Layers': // Merge PDF — layered blue-indigo glossy pages
        return (
          <g>
            <rect x="27" y="25" width="16" height="20" rx="3.5" fill="#93C5FD" />
            <rect x="31" y="29" width="16" height="20" rx="3.5" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.3" />
            <path d="M35 37H43M35 41H41" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="44" cy="31" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.2" />
            <path d="M42.2 31H45.8M44 29.2V32.8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
      case 'Scissors': // Split PDF — crisp 3D blue scissors cutting dotted line
        return (
          <g>
            <line x1="13" y1="36" x2="29" y2="36" stroke="#93C5FD" strokeWidth="2" strokeDasharray="2.5 2.5" strokeLinecap="round" />
            <g transform="translate(26, 25)">
              <circle cx="6" cy="18" r="4.8" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.3" />
              <circle cx="17" cy="18" r="4.8" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.3" />
              <path d="M8.5 14L17 3" stroke="#1D4ED8" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M14.5 14L6 3" stroke="#3B82F6" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="11.5" cy="9.5" r="1.4" fill="#FFFFFF" />
            </g>
          </g>
        );
      case 'RotateCw': // Rotate PDF — glossy circular blue arrow emblem
        return (
          <g>
            <circle cx="38" cy="38" r="11" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path
              d="M42.2 35.8A5 5 0 1 0 42 40.5"
              stroke="#FFFFFF"
              strokeWidth="2.3"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M40.5 32.8L43.5 36.2L39.6 37.2" fill="#FFFFFF" />
          </g>
        );
      case 'FileMinus': // Delete Pages — blue 3D trash/remove badge
        return (
          <g>
            <rect x="28" y="29" width="18" height="20" rx="4" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M31.5 29V26.5C31.5 25.4 32.4 24.5 33.5 24.5H40.5C41.6 24.5 42.5 25.4 42.5 26.5V29" stroke="#1D4ED8" strokeWidth="2.2" fill="none" />
            <rect x="26.5" y="28" width="21" height="3.2" rx="1.6" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="1" />
            <line x1="34" y1="34.5" x2="34" y2="43.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="37" y1="34.5" x2="37" y2="43.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="34.5" x2="40" y2="43.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'ArrowUpDown': // Reorder Pages — 3D bidirectional blue swap sphere
        return (
          <g>
            <rect x="27" y="27" width="21" height="21" rx="6" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M33.5 42V33M33.5 33L30.5 36M33.5 33L36.5 36" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M41.5 33V42M41.5 42L38.5 39M41.5 42L44.5 39" stroke="#DBEAFE" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'Minimize2': // Compress PDF — Emerald 3D clamp / compression press
        return (
          <g>
            <rect x="27" y="26" width="21" height="22" rx="6" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="31" y="29" width="13" height="3.2" rx="1.4" fill="#FFFFFF" />
            <rect x="31" y="42" width="13" height="3.2" rx="1.4" fill="#FFFFFF" />
            <path d="M37.5 32.5V36M37.5 36L35 34M37.5 36L40 34" stroke="#D1FAE5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M37.5 41.5V38M37.5 38L35 40M37.5 38L40 40" stroke="#D1FAE5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'FormFiller': // Financial Form Filler — Emerald clipboard checkmark
        return (
          <g>
            <rect x="27" y="27" width="21" height="21" rx="6" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M32 34H42M32 39H37" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="42" cy="41" r="4" fill="#FFFFFF" />
            <path d="M40.3 41L41.5 42.2L43.8 39.8" stroke="#059669" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'Image': // Images to PDF — Golden Amber photo card + blue mountain + green hill
        return (
          <g>
            <rect x="14" y="19" width="26" height="21" rx="4.5" fill="#FFFBEB" stroke={`url(#${uid}-accent)`} strokeWidth="2" />
            <circle cx="21" cy="25.5" r="2.4" fill="#F59E0B" />
            <path d="M16 37L23 29.5L28 34.5L32.5 30.5L38 37H16Z" fill="#10B981" />
            <circle cx="40" cy="40" r="7.5" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M40 43V37M40 37L37.5 39.5M40 37L42.5 39.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'FileImage': // PDF to Images — Amber stacked photo export
        return (
          <g>
            <rect x="26" y="27" width="22" height="20" rx="5" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="33" cy="34" r="2.2" fill="#FFFFFF" />
            <path d="M29 44L34.5 38L38.5 41.5L41.5 39L45 44H29Z" fill="#FEF3C7" />
          </g>
        );
      case 'ScanText': // OCR PDF — Warm Amber/Orange OCR brackets & text lines
        return (
          <g>
            <rect x="25" y="27" width="23" height="21" rx="6" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M30 33V31H33M43 33V31H40M30 42V44H33M43 42V44H40" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <text x="36.5" y="39.5" textAnchor="middle" fill="#FFFFFF" fontSize="6.8" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
              OCR
            </text>
          </g>
        );
      case 'Hash': // Add Page Numbers — Purple 3D pagination badge
        return (
          <g>
            <rect x="27" y="27" width="21" height="21" rx="6" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="37.5" y="41.5" textAnchor="middle" fill="#FFFFFF" fontSize="11.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
              #1
            </text>
          </g>
        );
      case 'Stamp': // Watermark PDF — Purple 3D stamp seal
        return (
          <g>
            <rect x="26" y="27" width="22" height="21" rx="6" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="37" cy="37.5" r="6" stroke="#FFFFFF" strokeWidth="1.9" strokeDasharray="2.5 1.8" />
            <circle cx="37" cy="37.5" r="2.4" fill="#DDD6FE" />
          </g>
        );
      case 'FilePenLine': // Edit Metadata — Purple 3D pencil badge
        return (
          <g>
            <circle cx="37.5" cy="37.5" r="11" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <path
              d="M33 41.5L34 38.2L40.5 31.7C41.1 31.1 42.1 31.1 42.7 31.7L43.3 32.3C43.9 32.9 43.9 33.9 43.3 34.5L36.8 41L33 41.5Z"
              fill="#FFFFFF"
            />
          </g>
        );
      case 'Unlock': // Unlock PDF — Purple/Emerald open padlock
        return (
          <g>
            <path
              d="M33 34V30.5C33 28 35 26 37.5 26C39.6 26 41.4 27.4 41.9 29.3"
              stroke="#7C3AED"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="29" y="33.5" width="17" height="14" rx="4" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.4" />
            <circle cx="37.5" cy="39.5" r="2" fill="#FFFFFF" />
            <rect x="36.6" y="40.5" width="1.8" height="3.2" rx="0.9" fill="#FFFFFF" />
          </g>
        );
      case 'PrivacyRedact': // Financial Privacy Redaction — Purple shield check
        return (
          <g>
            <path
              d="M37.5 26L46 29.5V36C46 41.6 42.3 45.8 37.5 47.5C32.7 45.8 29 41.6 29 36V29.5L37.5 26Z"
              fill={`url(#${uid}-accent)`}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <rect x="33.5" y="34.5" width="8" height="3" rx="1" fill="#FFFFFF" />
            <rect x="33.5" y="39" width="5.5" height="2.4" rx="1" fill="#DDD6FE" />
          </g>
        );
      default:
        return (
          <g>
            <circle cx="37.5" cy="37.5" r="10.5" fill={`url(#${uid}-accent)`} stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="33" y="35.5" width="9" height="4" rx="2" fill="#FFFFFF" />
          </g>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${sizeClass} ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_8px_rgba(15,23,42,0.08)]">
        <defs>
          <linearGradient id={`${uid}-sheet`} x1="10" y1="6" x2="40" y2="47" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="68%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id={`${uid}-fold`} x1="29" y1="6" x2="39" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id={`${uid}-red`} x1="6" y1="15" x2="27" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <linearGradient id={`${uid}-accent`} x1="26" y1="25" x2="47" y2="47" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={palette.start} />
            <stop offset="100%" stopColor={palette.end} />
          </linearGradient>
        </defs>

        {/* Soft ambient plate */}
        <rect x="8" y="44" width="32" height="5" rx="2.5" fill={palette.glow} />

        {/* Glossy 3D white PDF sheet */}
        <path
          d="M11 10.5C11 8.01472 13.0147 6 15.5 6H29.8L39.5 15.7V41.5C39.5 43.9853 37.4853 46 35 46H15.5C13.0147 46 11 43.9853 11 41.5V10.5Z"
          fill={`url(#${uid}-sheet)`}
          stroke="#CBD5E1"
          strokeWidth="1.2"
        />

        {/* Folded corner */}
        <path d="M29.8 6L39.5 15.7H32.5C31.0088 15.7 29.8 14.4912 29.8 13V6Z" fill={`url(#${uid}-fold)`} />

        {/* Faint document lines */}
        <rect x="16" y="29" width="16" height="2.4" rx="1.2" fill="#CBD5E1" />
        <rect x="16" y="34" width="11" height="2.4" rx="1.2" fill="#E2E8F0" />
        <rect x="16" y="39" width="13" height="2.4" rx="1.2" fill="#E2E8F0" />

        {/* Crisp 3D Red PDF ribbon */}
        {showPdfBadge && (
          <g>
            <rect x="6" y="14.5" width="22" height="10.5" rx="3" fill={`url(#${uid}-red)`} />
            <text
              x="17"
              y="22"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="6.7"
              fontWeight="800"
              letterSpacing="0.04em"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              PDF
            </text>
          </g>
        )}

        {/* Distinct 3D Tool Emblem */}
        {render3DOverlayEmblem()}
      </svg>
    </div>
  );
};

/**
 * 3D Upload Emblem for Hero Quick-Drop & DropZone workspaces.
 */
export const Upload3DIllustration: React.FC<{ active?: boolean; className?: string }> = ({
  active = false,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`w-16 h-16 select-none transition-transform duration-200 ${active ? 'scale-105' : ''} ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-plate`} x1="18" y1="12" x2="66" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`${uid}-btn`} x1="42" y1="40" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={`${uid}-tag`} x1="12" y1="24" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      <ellipse cx="44" cy="76" rx="26" ry="5" fill="rgba(37, 99, 235, 0.14)" />
      {/* Back sheet */}
      <rect x="26" y="10" width="40" height="52" rx="8" transform="rotate(6 26 10)" fill="#DBEAFE" />
      {/* Primary glossy sheet */}
      <path
        d="M20 18C20 14.6863 22.6863 12 26 12H49L62 25V62C62 65.3137 59.3137 68 56 68H26C22.6863 68 20 65.3137 20 62V18Z"
        fill={`url(#${uid}-plate)`}
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <path d="M49 12L62 25H53C50.7909 25 49 23.2091 49 21V12Z" fill="#CBD5E1" />
      {/* Red PDF badge */}
      <rect x="12" y="24" width="30" height="14" rx="4" fill={`url(#${uid}-tag)`} />
      <text x="27" y="34" textAnchor="middle" fill="#FFFFFF" fontSize="9.2" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        PDF
      </text>
      {/* Doc lines */}
      <rect x="27" y="45" width="22" height="3.2" rx="1.6" fill="#CBD5E1" />
      <rect x="27" y="52" width="16" height="3.2" rx="1.6" fill="#E2E8F0" />
      {/* Floating 3D Upload Sphere */}
      <circle cx="58" cy="56" r="16" fill={`url(#${uid}-btn)`} stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M58 62.5V49.5M58 49.5L52.5 55M58 49.5L63.5 55" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * 3D Floating Hero Illustration showcasing client-side PDF composition, colorful tool orbs,
 * red PDF sheets, and encrypted browser-only execution.
 */
export const HeroPdfIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 540 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="3D browser workspace showing PDF documents, editing tools, and local security"
      className={`w-full h-auto select-none ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="16" y1="16" x2="520" y2="404" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="50%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#ECFDF5" />
        </linearGradient>
        <linearGradient id={`${uid}-blue`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${uid}-purple`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={`${uid}-emerald`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${uid}-amber`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`${uid}-red`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id={`${uid}-sheet`} x1="180" y1="70" x2="380" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
      </defs>

      {/* Rounded Soft Backdrop Stage */}
      <rect x="14" y="14" width="512" height="392" rx="28" fill={`url(#${uid}-bg)`} stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="85" fill="#2563EB" opacity="0.06" />
      <circle cx="430" cy="300" r="95" fill="#7C3AED" opacity="0.06" />

      {/* Back tilted 3D sheets */}
      <rect x="132" y="96" width="180" height="225" rx="18" transform="rotate(-7 132 96)" fill="#DBEAFE" opacity="0.85" />
      <rect x="228" y="88" width="180" height="225" rx="18" transform="rotate(6 228 88)" fill="#EDE9FE" opacity="0.9" />

      {/* Center Glossy 3D Master Document */}
      <path
        d="M172 80C172 68.9543 180.954 60 192 60H314L368 114V322C368 333.046 359.046 342 348 342H192C180.954 342 172 333.046 172 322V80Z"
        fill={`url(#${uid}-sheet)`}
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <path d="M314 60L368 114H330C321.163 114 314 106.837 314 98V60Z" fill="#CBD5E1" />

      {/* 3D Red PDF Header Ribbon */}
      <rect x="146" y="96" width="94" height="38" rx="10" fill={`url(#${uid}-red)`} />
      <text x="193" y="122" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        PDF
      </text>

      {/* Clean internal wireframe blocks */}
      <rect x="200" y="156" width="136" height="10" rx="5" fill="#102A56" opacity="0.85" />
      <rect x="200" y="176" width="112" height="7" rx="3.5" fill="#94A3B8" opacity="0.55" />
      <rect x="200" y="191" width="128" height="7" rx="3.5" fill="#94A3B8" opacity="0.4" />

      {/* Embedded preview card inside center sheet */}
      <rect x="200" y="216" width="136" height="62" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <rect x="214" y="230" width="44" height="34" rx="7" fill="#EFF6FF" />
      <circle cx="228" cy="242" r="4" fill="#F59E0B" />
      <path d="M218 259L227 248L235 255L241 250L253 259H218Z" fill="#10B981" />
      <rect x="268" y="233" width="54" height="6" rx="3" fill="#2563EB" />
      <rect x="268" y="245" width="40" height="5" rx="2.5" fill="#94A3B8" />
      <rect x="268" y="256" width="48" height="5" rx="2.5" fill="#CBD5E1" />

      {/* Progress / Ready Bar */}
      <rect x="200" y="294" width="136" height="24" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
      <circle cx="216" cy="306" r="6" fill="#10B981" />
      <path d="M213.2 306L215.1 307.9L219 304" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="228" y="303" width="84" height="6" rx="3" fill="#059669" opacity="0.7" />

      {/* Floating Tool Orb 1 (Top-Left Blue: Organize) */}
      <g transform="translate(46, 86)">
        <rect x="0" y="0" width="84" height="84" rx="22" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="2" />
        <rect x="18" y="18" width="48" height="48" rx="14" fill={`url(#${uid}-blue)`} />
        <rect x="27" y="28" width="22" height="16" rx="3" fill="#FFFFFF" opacity="0.45" />
        <rect x="33" y="34" width="22" height="16" rx="3" fill="#FFFFFF" />
      </g>

      {/* Floating Tool Orb 2 (Top-Right Purple: Edit & Lock) */}
      <g transform="translate(406, 62)">
        <rect x="0" y="0" width="84" height="84" rx="22" fill="#FFFFFF" stroke="#EDE9FE" strokeWidth="2" />
        <rect x="18" y="18" width="48" height="48" rx="14" fill={`url(#${uid}-purple)`} />
        <path d="M35 39V34C35 30.7 37.7 28 41 28C44.3 28 47 30.7 47 34V39" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <rect x="31" y="38" width="20" height="15" rx="4" fill="#FFFFFF" />
        <circle cx="41" cy="45.5" r="2.2" fill="#7C3AED" />
      </g>

      {/* Floating Tool Orb 3 (Bottom-Left Amber: OCR / Convert) */}
      <g transform="translate(46, 250)">
        <rect x="0" y="0" width="84" height="84" rx="22" fill="#FFFFFF" stroke="#FEF3C7" strokeWidth="2" />
        <rect x="18" y="18" width="48" height="48" rx="14" fill={`url(#${uid}-amber)`} />
        <text x="42" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
          OCR
        </text>
      </g>

      {/* Floating Tool Orb 4 (Bottom-Right Emerald: Compress / Shield) */}
      <g transform="translate(406, 258)">
        <rect x="0" y="0" width="84" height="84" rx="22" fill="#FFFFFF" stroke="#D1FAE5" strokeWidth="2" />
        <rect x="18" y="18" width="48" height="48" rx="14" fill={`url(#${uid}-emerald)`} />
        <path
          d="M42 29L52 33.2V40.5C52 46.8 47.7 51.6 42 53.5C36.3 51.6 32 46.8 32 40.5V33.2L42 29Z"
          fill="#FFFFFF"
        />
        <path d="M38 41.2L40.8 44L46.4 38.4" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Subtle dotted connectors */}
      <path d="M130 132C148 132 154 146 172 150" stroke="#93C5FD" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M406 108C388 108 380 124 368 134" stroke="#C4B5FD" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M130 290C148 290 156 280 172 272" stroke="#FCD34D" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M406 296C388 296 380 284 368 278" stroke="#6EE7B7" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
    </svg>
  );
};

/**
 * 3D Illustration 1: Documents & Organization (#2563EB Blue).
 */
export const DocumentsOrganizeIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={`w-full h-auto select-none ${className}`}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="240" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id={`${uid}-blue`} x1="80" y1="24" x2="160" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="142" rx="18" fill={`url(#${uid}-bg)`} />
      <rect x="38" y="34" width="66" height="84" rx="10" transform="rotate(-8 38 34)" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
      <rect x="48" y="48" width="38" height="5" rx="2.5" transform="rotate(-8 48 48)" fill="#CBD5E1" />
      <rect x="136" y="32" width="66" height="84" rx="10" transform="rotate(8 136 32)" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
      <rect x="86" y="24" width="68" height="100" rx="12" fill={`url(#${uid}-blue)`} />
      <rect x="98" y="44" width="44" height="6" rx="3" fill="#FFFFFF" />
      <rect x="98" y="57" width="32" height="5" rx="2.5" fill="#DBEAFE" />
      <rect x="98" y="69" width="40" height="5" rx="2.5" fill="#93C5FD" />
      <rect x="98" y="92" width="44" height="18" rx="6" fill="#FFFFFF" />
      <rect x="108" y="99" width="24" height="4" rx="2" fill="#2563EB" />
    </svg>
  );
};

/**
 * 3D Illustration 2: Editing, Page Numbers, Watermarks & Metadata (#7C3AED Purple).
 */
export const EditingFormattingIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={`w-full h-auto select-none ${className}`}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="240" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#EDE9FE" />
        </linearGradient>
        <linearGradient id={`${uid}-purple`} x1="120" y1="30" x2="185" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="142" rx="18" fill={`url(#${uid}-bg)`} />
      <rect x="46" y="22" width="96" height="106" rx="12" fill="#FFFFFF" stroke="#C4B5FD" strokeWidth="1.5" />
      <rect x="60" y="38" width="52" height="6" rx="3" fill="#102A56" />
      <rect x="60" y="52" width="68" height="4" rx="2" fill="#CBD5E1" />
      <rect x="60" y="62" width="56" height="4" rx="2" fill="#CBD5E1" />
      <rect x="60" y="84" width="44" height="22" rx="6" fill="#F5F3FF" stroke="#DDD6FE" />
      <text x="82" y="99" textAnchor="middle" fill="#7C3AED" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        STAMP
      </text>
      {/* Floating 3D Purple Stamp / Edit Orb */}
      <circle cx="158" cy="76" r="34" fill={`url(#${uid}-purple)`} stroke="#FFFFFF" strokeWidth="3" />
      <path d="M145 86L148 76L164 60C165.6 58.4 168.2 58.4 169.8 60L171 61.2C172.6 62.8 172.6 65.4 171 67L155 83L145 86Z" fill="#FFFFFF" />
    </svg>
  );
};

/**
 * 3D Illustration 3: Local Security & Zero Server Uploads (#10B981 Emerald).
 */
export const LocalSecurityIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 420 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Client-side browser memory execution architecture diagram"
      className={`w-full h-auto select-none ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-emerald`} x1="120" y1="74" x2="174" y2="146" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${uid}-blue`} x1="24" y1="26" x2="260" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="412" height="192" rx="18" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Browser Sandbox Box */}
      <rect x="24" y="24" width="236" height="152" rx="14" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="24" y="24" width="236" height="28" rx="14" fill={`url(#${uid}-blue)`} />
      <path d="M24 40H260V52H24V40Z" fill={`url(#${uid}-blue)`} />
      <circle cx="40" cy="38" r="3.5" fill="#FFFFFF" opacity="0.85" />
      <rect x="52" y="35.5" width="96" height="5" rx="2.5" fill="#FFFFFF" />

      {/* Local File -> RAM Engine -> Export */}
      <rect x="38" y="74" width="56" height="72" rx="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
      <rect x="48" y="88" width="36" height="5" rx="2.5" fill="#102A56" />
      <rect x="48" y="99" width="28" height="4" rx="2" fill="#64748B" opacity="0.6" />
      <rect x="48" y="109" width="36" height="4" rx="2" fill="#64748B" opacity="0.4" />
      <rect x="48" y="124" width="32" height="10" rx="4" fill="#EFF6FF" />

      <path d="M98 110H116" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M112 106L117 110L112 114" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="120" y="74" width="54" height="72" rx="10" fill={`url(#${uid}-emerald)`} />
      <circle cx="147" cy="100" r="11" fill="#FFFFFF" />
      <path d="M142.5 100L145.5 103L151.5 97" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="131" y="120" width="32" height="4" rx="2" fill="#FFFFFF" />
      <rect x="136" y="129" width="22" height="4" rx="2" fill="#D1FAE5" />

      <path d="M178 110H194" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M190 106L195 110L190 114" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="196" y="74" width="50" height="72" rx="10" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.2" />
      <rect x="206" y="90" width="30" height="5" rx="2.5" fill="#065F46" />
      <rect x="206" y="101" width="24" height="4" rx="2" fill="#059669" opacity="0.6" />
      <rect x="206" y="122" width="30" height="12" rx="4" fill="#10B981" />

      {/* Blocked Remote Server Wall */}
      <line x1="278" y1="34" x2="278" y2="166" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" />
      <circle cx="278" cy="100" r="14" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1.5" />
      <path d="M273 95L283 105M283 95L273 105" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />

      {/* Remote Cloud (Disconnected) */}
      <rect x="300" y="54" width="96" height="92" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.9" />
      <path
        d="M332 104H365C370 104 374 100 374 95C374 90.5 370.5 87 366 86.5C364 79.5 357.5 75 350 75C341 75 334 82 333.5 90.5C328.5 91 325 95 325 99.5C325 102 328 104 332 104Z"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <rect x="322" y="118" width="52" height="5" rx="2.5" fill="#94A3B8" opacity="0.6" />
      <rect x="330" y="128" width="36" height="4" rx="2" fill="#CBD5E1" />
    </svg>
  );
};

/**
 * 3D Illustration 4: Conversion & OCR Engine (#F59E0B Amber).
 */
export const ConversionEngineIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={`w-full h-auto select-none ${className}`}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="240" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
        <linearGradient id={`${uid}-amber`} x1="120" y1="36" x2="195" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="142" rx="18" fill={`url(#${uid}-bg)`} />
      {/* Left PDF Card */}
      <rect x="34" y="34" width="66" height="84" rx="12" fill="#FFFFFF" stroke="#FCD34D" strokeWidth="1.5" />
      <rect x="42" y="48" width="34" height="14" rx="4" fill="#EF4444" />
      <text x="59" y="58" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        PDF
      </text>
      <rect x="44" y="72" width="44" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="44" y="83" width="32" height="5" rx="2.5" fill="#E2E8F0" />

      {/* Center Bidirectional Arrow */}
      <circle cx="120" cy="76" r="14" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
      <path d="M113 76H127M123 72L127 76L123 80" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Right Image / OCR Output */}
      <rect x="140" y="34" width="66" height="84" rx="12" fill={`url(#${uid}-amber)`} />
      <rect x="150" y="46" width="46" height="36" rx="7" fill="#FFFFFF" />
      <circle cx="161" cy="56" r="4" fill="#F59E0B" />
      <path d="M153 78L164 65L172 72L180 65L193 78H153Z" fill="#10B981" />
      <rect x="150" y="92" width="46" height="14" rx="5" fill="#FFFFFF" opacity="0.92" />
      <text x="173" y="102" textAnchor="middle" fill="#D97706" fontSize="7.5" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
        PNG · OCR
      </text>
    </svg>
  );
};

/**
 * Clean 3D empty search vector.
 */
export const EmptySearchIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 180 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`w-40 h-auto mx-auto select-none ${className}`}
  >
    <rect x="26" y="18" width="92" height="84" rx="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
    <rect x="40" y="34" width="54" height="6" rx="3" fill="#CBD5E1" />
    <rect x="40" y="48" width="42" height="5" rx="2.5" fill="#E2E8F0" />
    <rect x="40" y="61" width="48" height="5" rx="2.5" fill="#E2E8F0" />
    <rect x="40" y="76" width="32" height="10" rx="4" fill="#EFF6FF" />

    <circle cx="118" cy="72" r="24" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
    <circle cx="118" cy="72" r="14" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5" />
    <path d="M135 89L150 104" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

/**
 * Clean geometric 404 3D illustration.
 */
export const NotFoundIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 240 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`w-56 h-auto mx-auto select-none ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-hdr`} x1="44" y1="34" x2="196" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="20" y="16" width="200" height="118" rx="18" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="44" y="34" width="152" height="82" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
      <rect x="44" y="34" width="152" height="22" rx="12" fill={`url(#${uid}-hdr)`} />
      <path d="M44 46H196V56H44V46Z" fill={`url(#${uid}-hdr)`} />
      <circle cx="58" cy="45" r="3" fill="#FFFFFF" />
      <rect x="70" y="42.5" width="48" height="5" rx="2.5" fill="#FFFFFF" opacity="0.8" />
      <text
        x="120"
        y="94"
        textAnchor="middle"
        fill="#102A56"
        fontSize="30"
        fontWeight="800"
        fontFamily="JetBrains Mono, monospace"
      >
        404
      </text>
      <rect x="86" y="102" width="68" height="4" rx="2" fill="#2563EB" />
    </svg>
  );
};
