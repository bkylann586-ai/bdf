import React from 'react';
import {
  Layers,
  Scissors,
  RotateCw,
  FileMinus,
  ArrowUpDown,
  Minimize2,
  Image,
  FileImage,
  Hash,
  Stamp,
  ScanText,
  FilePenLine,
  Unlock,
  FileCheck2,
  ShieldAlert,
  FileText,
} from 'lucide-react';

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

interface ToolIconProps {
  name: UnifiedToolIconName;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'navy' | 'blue' | 'cyan' | 'emerald' | 'dark';
  className?: string;
}

/**
 * Unified, single-family technical icon badge for all 15 PDFQuick tools.
 * Eliminates ad-hoc colors or emojis while maintaining crisp contrast.
 */
export const ToolIcon: React.FC<ToolIconProps> = ({
  name,
  size = 'md',
  tone = 'blue',
  className = '',
}) => {
  const sizeStyles =
    size === 'sm'
      ? 'w-9 h-9 rounded-lg'
      : size === 'lg'
        ? 'w-12 h-12 rounded-xl'
        : 'w-10 h-10 rounded-xl';

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  const toneStyles =
    tone === 'navy'
      ? 'bg-[#102A56] text-white border border-[#102A56]'
      : tone === 'cyan'
        ? 'bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]'
        : tone === 'emerald'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          : tone === 'dark'
            ? 'bg-white/10 text-[#38BDF8] border border-white/15'
            : 'bg-[#F4F7FB] text-[#2563EB] border border-[#E2E8F0] group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB]';

  const renderGlyph = () => {
    switch (name) {
      case 'Layers':
        return <Layers className={iconSize} strokeWidth={1.9} />;
      case 'Scissors':
        return <Scissors className={iconSize} strokeWidth={1.9} />;
      case 'RotateCw':
        return <RotateCw className={iconSize} strokeWidth={1.9} />;
      case 'FileMinus':
        return <FileMinus className={iconSize} strokeWidth={1.9} />;
      case 'ArrowUpDown':
        return <ArrowUpDown className={iconSize} strokeWidth={1.9} />;
      case 'Minimize2':
        return <Minimize2 className={iconSize} strokeWidth={1.9} />;
      case 'Image':
        return <Image className={iconSize} strokeWidth={1.9} />;
      case 'FileImage':
        return <FileImage className={iconSize} strokeWidth={1.9} />;
      case 'Hash':
        return <Hash className={iconSize} strokeWidth={1.9} />;
      case 'Stamp':
        return <Stamp className={iconSize} strokeWidth={1.9} />;
      case 'ScanText':
        return <ScanText className={iconSize} strokeWidth={1.9} />;
      case 'FilePenLine':
        return <FilePenLine className={iconSize} strokeWidth={1.9} />;
      case 'Unlock':
        return <Unlock className={iconSize} strokeWidth={1.9} />;
      case 'FormFiller':
        return <FileCheck2 className={iconSize} strokeWidth={1.9} />;
      case 'PrivacyRedact':
        return <ShieldAlert className={iconSize} strokeWidth={1.9} />;
      default:
        return <FileText className={iconSize} strokeWidth={1.9} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-colors duration-150 ${sizeStyles} ${toneStyles} ${className}`}
      aria-hidden="true"
    >
      {renderGlyph()}
    </div>
  );
};

/**
 * Asymmetric SaaS hero technical illustration showing multi-document composition,
 * client-side sandbox verification, and crisp output sheet without heavy images.
 */
export const HeroPdfIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 540 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Client-side PDF document processing workspace diagram"
    className={`w-full h-auto select-none ${className}`}
  >
    {/* Subtle technical canvas frame */}
    <rect x="12" y="12" width="516" height="396" rx="20" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Top mock window chrome */}
    <rect x="12" y="12" width="516" height="44" rx="20" fill="#FFFFFF" />
    <path d="M12 36H528V56H12V36Z" fill="#FFFFFF" />
    <line x1="12" y1="56" x2="528" y2="56" stroke="#E2E8F0" strokeWidth="1.2" />
    <circle cx="38" cy="34" r="5" fill="#CBD5E1" />
    <circle cx="56" cy="34" r="5" fill="#CBD5E1" />
    <circle cx="74" cy="34" r="5" fill="#38BDF8" />
    <rect x="150" y="25" width="220" height="18" rx="9" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1" />
    <rect x="166" y="31.5" width="94" height="5" rx="2.5" fill="#64748B" opacity="0.45" />
    <rect x="424" y="24" width="84" height="20" rx="6" fill="#102A56" />
    <rect x="440" y="32" width="52" height="4" rx="2" fill="#38BDF8" />

    {/* Left queue cards (input files) */}
    <g>
      <rect x="36" y="82" width="164" height="72" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <rect x="50" y="96" width="32" height="40" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <rect x="57" y="106" width="18" height="3" rx="1.5" fill="#2563EB" />
      <rect x="57" y="113" width="14" height="3" rx="1.5" fill="#38BDF8" />
      <rect x="57" y="120" width="18" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="92" y="100" width="88" height="6" rx="3" fill="#17243A" />
      <rect x="92" y="114" width="58" height="4" rx="2" fill="#64748B" opacity="0.6" />
      <rect x="92" y="128" width="42" height="12" rx="4" fill="#F4F7FB" />
      <rect x="98" y="132" width="30" height="4" rx="2" fill="#2563EB" />
    </g>

    <g>
      <rect x="36" y="168" width="164" height="72" rx="12" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="50" y="182" width="32" height="40" rx="6" fill="#102A56" />
      <rect x="57" y="192" width="18" height="3" rx="1.5" fill="#FFFFFF" />
      <rect x="57" y="199" width="14" height="3" rx="1.5" fill="#38BDF8" />
      <rect x="57" y="206" width="18" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="92" y="186" width="90" height="6" rx="3" fill="#17243A" />
      <rect x="92" y="200" width="66" height="4" rx="2" fill="#64748B" opacity="0.6" />
      <rect x="92" y="214" width="54" height="12" rx="4" fill="#EFF6FF" />
      <rect x="98" y="218" width="42" height="4" rx="2" fill="#2563EB" />
    </g>

    <g>
      <rect x="36" y="254" width="164" height="72" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
      <rect x="50" y="268" width="32" height="40" rx="6" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
      <rect x="57" y="278" width="18" height="3" rx="1.5" fill="#0284C7" />
      <rect x="57" y="285" width="14" height="3" rx="1.5" fill="#38BDF8" />
      <rect x="57" y="292" width="18" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="92" y="272" width="76" height="6" rx="3" fill="#17243A" />
      <rect x="92" y="286" width="52" height="4" rx="2" fill="#64748B" opacity="0.6" />
      <rect x="92" y="300" width="46" height="12" rx="4" fill="#F4F7FB" />
      <rect x="98" y="304" width="34" height="4" rx="2" fill="#64748B" />
    </g>

    {/* Connecting vector flow lines to browser sandbox processor */}
    <path d="M200 118H236C244 118 248 122 248 130V188" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M200 204H260" stroke="#2563EB" strokeWidth="2.2" />
    <path d="M200 290H236C244 290 248 286 248 278V220" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="248" cy="204" r="18" fill="#102A56" stroke="#38BDF8" strokeWidth="2.5" />
    {/* Shield / Lock motif inside center processor node */}
    <path
      d="M248 195L255 198V204C255 208.5 251.9 212 248 213.5C244.1 212 241 208.5 241 204V198L248 195Z"
      fill="#38BDF8"
    />
    <path d="M245.5 204L247.3 205.8L251 202.1" stroke="#102A56" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />

    {/* Connector to primary output preview */}
    <path d="M266 204H296" stroke="#2563EB" strokeWidth="2.2" />
    <path d="M291 199L297 204L291 209" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Right side: Main output document sheet */}
    <g>
      <rect x="304" y="82" width="198" height="260" rx="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.4" />
      {/* Navy top document ribbon */}
      <path d="M304 96C304 88.268 310.268 82 318 82H488C495.732 82 502 88.268 502 96V122H304V96Z" fill="#102A56" />
      <rect x="322" y="96" width="84" height="6" rx="3" fill="#FFFFFF" />
      <rect x="322" y="107" width="46" height="4" rx="2" fill="#38BDF8" />
      <rect x="444" y="94" width="42" height="16" rx="5" fill="#2563EB" />
      <rect x="453" y="100" width="24" height="4" rx="2" fill="#FFFFFF" />

      {/* Crisp internal preview grid & document wireframe */}
      <rect x="322" y="140" width="162" height="48" rx="8" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="334" y="152" width="68" height="6" rx="3" fill="#17243A" />
      <rect x="334" y="164" width="112" height="4" rx="2" fill="#64748B" opacity="0.5" />
      <rect x="334" y="173" width="90" height="4" rx="2" fill="#64748B" opacity="0.35" />

      <rect x="322" y="200" width="76" height="58" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <rect x="334" y="214" width="52" height="4" rx="2" fill="#2563EB" />
      <rect x="334" y="224" width="38" height="4" rx="2" fill="#38BDF8" />
      <rect x="334" y="236" width="44" height="10" rx="4" fill="#FFFFFF" />

      <rect x="408" y="200" width="76" height="58" rx="8" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="420" y="214" width="52" height="4" rx="2" fill="#17243A" opacity="0.7" />
      <rect x="420" y="224" width="42" height="4" rx="2" fill="#64748B" opacity="0.5" />
      <rect x="420" y="234" width="48" height="4" rx="2" fill="#64748B" opacity="0.35" />

      {/* Bottom progress / ready footer inside output card */}
      <rect x="322" y="274" width="162" height="48" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="342" cy="298" r="10" fill="#ECFDF5" />
      <path d="M337.5 298L340.5 301L346.5 295" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="360" y="290" width="76" height="5" rx="2.5" fill="#17243A" />
      <rect x="360" y="301" width="108" height="4" rx="2" fill="#10B981" opacity="0.6" />
    </g>

    {/* Bottom execution telemetry footer bar */}
    <rect x="36" y="356" width="466" height="32" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <circle cx="54" cy="372" r="4" fill="#10B981" />
    <rect x="66" y="369.5" width="128" height="5" rx="2.5" fill="#17243A" opacity="0.75" />
    <rect x="348" y="369.5" width="66" height="5" rx="2.5" fill="#2563EB" opacity="0.7" />
    <rect x="426" y="369.5" width="60" height="5" rx="2.5" fill="#64748B" opacity="0.45" />
  </svg>
);

/**
 * Technical diagram illustrating local browser RAM architecture (Zero Cloud Upload).
 */
export const LocalSecurityIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 420 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Client-side browser memory execution architecture diagram"
    className={`w-full h-auto select-none ${className}`}
  >
    <rect x="4" y="4" width="412" height="192" rx="16" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Browser Sandbox Box */}
    <rect x="24" y="26" width="236" height="148" rx="12" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
    <rect x="24" y="26" width="236" height="28" rx="12" fill="#102A56" />
    <path d="M24 42H260V54H24V42Z" fill="#102A56" />
    <circle cx="40" cy="40" r="3.5" fill="#38BDF8" />
    <rect x="52" y="37.5" width="96" height="5" rx="2.5" fill="#FFFFFF" />

    {/* Local File -> RAM Engine -> Export */}
    <rect x="38" y="74" width="56" height="72" rx="8" fill="#F4F7FB" stroke="#CBD5E1" strokeWidth="1.2" />
    <rect x="48" y="88" width="36" height="5" rx="2.5" fill="#102A56" />
    <rect x="48" y="99" width="28" height="4" rx="2" fill="#64748B" opacity="0.6" />
    <rect x="48" y="109" width="36" height="4" rx="2" fill="#64748B" opacity="0.4" />
    <rect x="48" y="124" width="32" height="10" rx="4" fill="#EFF6FF" />

    <path d="M98 110H116" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    <path d="M112 106L117 110L112 114" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

    <rect x="120" y="74" width="54" height="72" rx="8" fill="#102A56" />
    <circle cx="147" cy="100" r="11" fill="#2563EB" />
    <path d="M142.5 100L145.5 103L151.5 97" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="131" y="120" width="32" height="4" rx="2" fill="#FFFFFF" />
    <rect x="136" y="129" width="22" height="4" rx="2" fill="#38BDF8" />

    <path d="M178 110H194" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    <path d="M190 106L195 110L190 114" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

    <rect x="196" y="74" width="50" height="72" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.2" />
    <rect x="206" y="90" width="30" height="5" rx="2.5" fill="#065F46" />
    <rect x="206" y="101" width="24" height="4" rx="2" fill="#059669" opacity="0.6" />
    <rect x="206" y="122" width="30" height="12" rx="4" fill="#10B981" />

    {/* Blocked Remote Server Wall */}
    <line x1="278" y1="36" x2="278" y2="164" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" />
    <circle cx="278" cy="100" r="14" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1.5" />
    <path d="M273 95L283 105M283 95L273 105" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />

    {/* Remote Cloud (Disconnected) */}
    <rect x="300" y="54" width="96" height="92" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.85" />
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

/**
 * Clean 3-step pipeline vector for empty states or workflow overview.
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
    <rect x="26" y="18" width="92" height="84" rx="12" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1.5" />
    <rect x="40" y="34" width="54" height="6" rx="3" fill="#CBD5E1" />
    <rect x="40" y="48" width="42" height="5" rx="2.5" fill="#E2E8F0" />
    <rect x="40" y="61" width="48" height="5" rx="2.5" fill="#E2E8F0" />
    <rect x="40" y="76" width="32" height="10" rx="4" fill="#EFF6FF" />

    {/* Magnifying lens */}
    <circle cx="118" cy="72" r="24" fill="#FFFFFF" stroke="#102A56" strokeWidth="3" />
    <circle cx="118" cy="72" r="14" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1.5" />
    <path d="M135 89L150 104" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

/**
 * Clean geometric 404 technical illustration.
 */
export const NotFoundIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`w-56 h-auto mx-auto select-none ${className}`}
  >
    <rect x="20" y="16" width="200" height="118" rx="16" fill="#F4F7FB" stroke="#E2E8F0" strokeWidth="1.5" />
    <rect x="44" y="34" width="152" height="82" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
    <rect x="44" y="34" width="152" height="22" rx="10" fill="#102A56" />
    <path d="M44 46H196V56H44V46Z" fill="#102A56" />
    <circle cx="58" cy="45" r="3" fill="#38BDF8" />
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
    <rect x="86" y="102" width="68" height="4" rx="2" fill="#38BDF8" />
  </svg>
);
