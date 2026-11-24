import { PDFDocument, PDFFont, PDFPage, StandardFonts, RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import ArabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

export interface PdfFontByteBundle {
  latinRegular: Uint8Array;
  latinBold: Uint8Array;
  arabicRegular: Uint8Array;
  arabicBold: Uint8Array;
}

export interface EmbeddedPdfFonts {
  latinRegular: PDFFont;
  latinBold: PDFFont;
  arabicRegular: PDFFont | null;
  arabicBold: PDFFont | null;
  arabicSet: Set<number>;
  latinSet: Set<number>;
  hasUnicodeFonts: boolean;
}

let cachedFontBytes: PdfFontByteBundle | null = null;

function isArabicCodePoint(cp: number): boolean {
  return (
    (cp >= 0x0600 && cp <= 0x06ff) ||
    (cp >= 0x0750 && cp <= 0x077f) ||
    (cp >= 0x08a0 && cp <= 0x08ff) ||
    (cp >= 0xfb50 && cp <= 0xfdff) ||
    (cp >= 0xfe70 && cp <= 0xfeff)
  );
}

export function containsArabicScript(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (isArabicCodePoint(text.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}

export function detectTextDirection(text: string): 'rtl' | 'ltr' {
  for (const ch of text) {
    const type = bidi.getBidiCharTypeName?.(ch);
    if (type === 'AL' || type === 'R') return 'rtl';
    if (type === 'L') return 'ltr';
  }
  return containsArabicScript(text) ? 'rtl' : 'ltr';
}

function normalizePunctuation(input: string): string {
  return (input || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u00A0/g, ' ');
}

function isControlOrIsolate(cp: number): boolean {
  return (
    cp === 0x200e ||
    cp === 0x200f ||
    (cp >= 0x202a && cp <= 0x202e) ||
    (cp >= 0x2066 && cp <= 0x2069) ||
    cp === 0xfeff
  );
}

/**
 * Load Noto Sans + Noto Sans Arabic TTF byte bundles from local PWA/public assets (browser)
 * or filesystem (Node tests), caching in RAM for repeat exports.
 */
export async function loadNotoFontBytes(): Promise<PdfFontByteBundle | null> {
  if (cachedFontBytes) {
    return cachedFontBytes;
  }

  const paths = {
    latinRegular: '/fonts/NotoSans-Regular.ttf',
    latinBold: '/fonts/NotoSans-Bold.ttf',
    arabicRegular: '/fonts/NotoSansArabic-Regular.ttf',
    arabicBold: '/fonts/NotoSansArabic-Bold.ttf',
  };

  // Browser environment (cached offline by Workbox PWA)
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const fetchBin = async (url: string): Promise<Uint8Array> => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
        return new Uint8Array(await res.arrayBuffer());
      };

      const [latinRegular, latinBold, arabicRegular, arabicBold] = await Promise.all([
        fetchBin(paths.latinRegular),
        fetchBin(paths.latinBold),
        fetchBin(paths.arabicRegular),
        fetchBin(paths.arabicBold),
      ]);

      cachedFontBytes = { latinRegular, latinBold, arabicRegular, arabicBold };
      return cachedFontBytes;
    } catch {
      return null;
    }
  }

  // Node.js SSR / CLI Verification environment
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const resolveFont = (rel: string) =>
      new Uint8Array(fs.readFileSync(path.resolve(process.cwd(), 'public', rel.replace(/^\/+/, ''))));

    cachedFontBytes = {
      latinRegular: resolveFont(paths.latinRegular),
      latinBold: resolveFont(paths.latinBold),
      arabicRegular: resolveFont(paths.arabicRegular),
      arabicBold: resolveFont(paths.arabicBold),
    };
    return cachedFontBytes;
  } catch {
    return null;
  }
}

export async function embedMultilingualPdfFonts(
  pdfDoc: PDFDocument,
  customBytes?: PdfFontByteBundle | null
): Promise<EmbeddedPdfFonts> {
  const bundle = customBytes ?? (await loadNotoFontBytes());

  if (bundle) {
    try {
      pdfDoc.registerFontkit(fontkit as any);
      const [latinRegular, latinBold, arabicRegular, arabicBold] = await Promise.all([
        pdfDoc.embedFont(bundle.latinRegular, { subset: true }),
        pdfDoc.embedFont(bundle.latinBold, { subset: true }),
        pdfDoc.embedFont(bundle.arabicRegular, { subset: true }),
        pdfDoc.embedFont(bundle.arabicBold, { subset: true }),
      ]);

      return {
        latinRegular,
        latinBold,
        arabicRegular,
        arabicBold,
        arabicSet: new Set(arabicRegular.getCharacterSet()),
        latinSet: new Set(latinRegular.getCharacterSet()),
        hasUnicodeFonts: true,
      };
    } catch {
      // Fallback safely below
    }
  }

  const [latinRegular, latinBold] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
  ]);
  return {
    latinRegular,
    latinBold,
    arabicRegular: null,
    arabicBold: null,
    arabicSet: new Set(),
    latinSet: new Set(latinRegular.getCharacterSet()),
    hasUnicodeFonts: false,
  };
}

/**
 * Filter characters unencodable by both Latin and Arabic TTF fonts cleanly without corrupting PDF streams.
 */
function filterEncodable(str: string, fonts: EmbeddedPdfFonts): string {
  if (!fonts.hasUnicodeFonts) {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      out += (code >= 32 && code <= 126) || (code >= 160 && code <= 255) ? str[i] : '?';
    }
    return out;
  }

  let out = '';
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;
    if (isControlOrIsolate(cp)) continue;
    if (fonts.arabicSet.has(cp) || fonts.latinSet.has(cp)) {
      out += ch;
    } else {
      out += ' ';
    }
  }
  return out;
}

/**
 * Shape Arabic contextual forms + Presentation Forms ligatures and reorder visually via UAX #9 BiDi.
 * Also isolates USD monetary tokens (-$1,234.56) in RTL lines so currency signs stay anchored left of numbers.
 */
export function shapeLogicalLineForPdf(
  logicalLine: string,
  baseDir: 'rtl' | 'ltr' | 'auto',
  fonts: EmbeddedPdfFonts
): string {
  const normalized = normalizePunctuation(logicalLine);
  if (!normalized.trim()) return '';

  const resolvedDir = baseDir === 'auto' ? detectTextDirection(normalized) : baseDir;
  if (!fonts.hasUnicodeFonts) {
    return filterEncodable(normalized, fonts);
  }

  const reshaped = ArabicReshaper.convertArabic(normalized);
  const isolated =
    resolvedDir === 'rtl'
      ? reshaped.replace(/(-?\$[0-9,]+(?:\.[0-9]+)?)/g, '\u2066$1\u2069')
      : reshaped;

  const levels = bidi.getEmbeddingLevels(isolated, resolvedDir);
  const mirrored = bidi.getMirroredCharactersMap(isolated, levels);
  const indices = bidi.getReorderedIndices(isolated, levels);

  let visual = '';
  for (const idx of indices) {
    const ch = mirrored.get(idx) ?? isolated[idx];
    const cp = ch.codePointAt(0)!;
    if (isControlOrIsolate(cp)) continue;
    visual += ch;
  }

  return filterEncodable(visual, fonts);
}

interface TextRun {
  text: string;
  font: PDFFont;
}

function splitIntoFontRuns(
  visualLine: string,
  bold: boolean,
  fonts: EmbeddedPdfFonts
): TextRun[] {
  const latinFont = bold ? fonts.latinBold : fonts.latinRegular;
  const arabicFont = (bold ? fonts.arabicBold : fonts.arabicRegular) ?? latinFont;

  if (!fonts.hasUnicodeFonts) {
    return [{ text: visualLine, font: latinFont }];
  }

  const runs: TextRun[] = [];
  let curText = '';
  let curUseArabic = false;

  const flush = () => {
    if (!curText) return;
    runs.push({ text: curText, font: curUseArabic ? arabicFont : latinFont });
    curText = '';
  };

  for (const ch of visualLine) {
    const cp = ch.codePointAt(0)!;
    const useArabic = isArabicCodePoint(cp) && fonts.arabicSet.has(cp);
    if (curText && useArabic !== curUseArabic) {
      flush();
    }
    curUseArabic = useArabic;
    curText += ch;
  }
  flush();

  return runs;
}

export function measureVisualLineWidth(
  visualLine: string,
  size: number,
  bold: boolean,
  fonts: EmbeddedPdfFonts
): number {
  const runs = splitIntoFontRuns(visualLine, bold, fonts);
  let total = 0;
  for (const run of runs) {
    total += run.font.widthOfTextAtSize(run.text, size);
  }
  return total;
}

export interface WrappedVisualLine {
  visual: string;
  dir: 'rtl' | 'ltr';
}

/**
 * Word-wrap logical paragraphs into visually shaped RTL/LTR lines fitting within maxWidth.
 */
export function wrapMultilingualText(
  logicalText: string,
  size: number,
  maxWidth: number,
  bold: boolean,
  fonts: EmbeddedPdfFonts,
  forcedDir: 'rtl' | 'ltr' | 'auto' = 'auto'
): WrappedVisualLine[] {
  const safeNormalized = normalizePunctuation(logicalText);
  const paragraphs = safeNormalized.split(/\r?\n/);
  const lines: WrappedVisualLine[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const paraDir = forcedDir === 'auto' ? detectTextDirection(trimmed) : forcedDir;
    if (!trimmed) {
      lines.push({ visual: '', dir: paraDir });
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLogical = '';

    for (const word of words) {
      const candidate = currentLogical ? `${currentLogical} ${word}` : word;
      const candidateVisual = shapeLogicalLineForPdf(candidate, paraDir, fonts);
      if (measureVisualLineWidth(candidateVisual, size, bold, fonts) <= maxWidth) {
        currentLogical = candidate;
      } else {
        if (currentLogical) {
          lines.push({
            visual: shapeLogicalLineForPdf(currentLogical, paraDir, fonts),
            dir: paraDir,
          });
          currentLogical = '';
        }

        const singleWordVisual = shapeLogicalLineForPdf(word, paraDir, fonts);
        if (measureVisualLineWidth(singleWordVisual, size, bold, fonts) > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            const nextChunk = chunk + ch;
            const nextVisual = shapeLogicalLineForPdf(nextChunk, paraDir, fonts);
            if (measureVisualLineWidth(nextVisual, size, bold, fonts) <= maxWidth) {
              chunk = nextChunk;
            } else {
              if (chunk) {
                lines.push({
                  visual: shapeLogicalLineForPdf(chunk, paraDir, fonts),
                  dir: paraDir,
                });
              }
              chunk = ch;
            }
          }
          currentLogical = chunk;
        } else {
          currentLogical = word;
        }
      }
    }

    if (currentLogical) {
      lines.push({
        visual: shapeLogicalLineForPdf(currentLogical, paraDir, fonts),
        dir: paraDir,
      });
    }
  }

  return lines.length > 0 ? lines : [{ visual: '', dir: forcedDir === 'rtl' ? 'rtl' : 'ltr' }];
}

export interface DrawVisualLineOptions {
  x: number;
  y: number;
  maxWidth?: number;
  size: number;
  bold?: boolean;
  color: RGB;
  opacity?: number;
  align?: 'left' | 'right' | 'center' | 'auto';
  dir?: 'rtl' | 'ltr';
}

export function drawVisualPdfLine(
  page: PDFPage,
  visualLine: string,
  fonts: EmbeddedPdfFonts,
  opts: DrawVisualLineOptions
): void {
  if (!visualLine) return;
  const { x, y, maxWidth = 0, size, bold = false, color, opacity, align = 'left', dir = 'ltr' } = opts;

  const runs = splitIntoFontRuns(visualLine, bold, fonts);
  const totalWidth = runs.reduce((acc, r) => acc + r.font.widthOfTextAtSize(r.text, size), 0);

  let effectiveAlign = align;
  if (effectiveAlign === 'auto') {
    effectiveAlign = dir === 'rtl' ? 'right' : 'left';
  }

  let drawX = x;
  if (effectiveAlign === 'right' && maxWidth > 0) {
    drawX = x + Math.max(0, maxWidth - totalWidth);
  } else if (effectiveAlign === 'center' && maxWidth > 0) {
    drawX = x + Math.max(0, (maxWidth - totalWidth) / 2);
  }

  for (const run of runs) {
    page.drawText(run.text, {
      x: drawX,
      y,
      size,
      font: run.font,
      color,
      ...(typeof opacity === 'number' ? { opacity } : {}),
    });
    drawX += run.font.widthOfTextAtSize(run.text, size);
  }
}
