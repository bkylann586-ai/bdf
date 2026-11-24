import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { FinancialTemplateId, FinancialTemplateMeta, ProcessingResult } from '../types';
import { HELPER_TEMPLATE_DISCLAIMER } from './financialTemplates';
import {
  ARABIC_HELPER_DISCLAIMER,
  FINANCIAL_TEMPLATES_AR,
  translateSummaryLabelAr,
} from './financialTemplatesAr';
import {
  PdfFontByteBundle,
  containsArabicScript,
  drawVisualPdfLine,
  embedMultilingualPdfFonts,
  shapeLogicalLineForPdf,
  wrapMultilingualText,
} from './arabicPdfText';

export type FinancialPaperSize = 'letter' | 'a4';
export type WorksheetPdfLanguage = 'en' | 'ar';

export interface FinancialSummaryMetric {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

export interface GenerateFinancialFormPdfOptions {
  template: FinancialTemplateMeta;
  values: Record<string, string>;
  paperSize: FinancialPaperSize;
  worksheetLanguage?: WorksheetPdfLanguage;
  includeBlankOptionalFields?: boolean;
  customNotes?: string;
  customFonts?: PdfFontByteBundle;
}

const PAPER_DIMENSIONS: Record<FinancialPaperSize, { width: number; height: number; label: string; labelAr: string }> = {
  letter: {
    width: 612,
    height: 792,
    label: 'US Letter (8.5 x 11 in)',
    labelAr: 'مقاس US Letter (8.5 × 11 بوصة)',
  },
  a4: {
    width: 595.28,
    height: 841.89,
    label: 'ISO A4 (210 x 297 mm)',
    labelAr: 'مقاس ISO A4 (210 × 297 مم)',
  },
};

/**
 * Normalize punctuation and strip characters outside WinAnsi so legacy single-byte helpers stay safe.
 */
export function sanitizeWinAnsiText(input: string): { text: string; replacedUnsupported: boolean } {
  const normalized = (input || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u00A0/g, ' ');

  let replacedUnsupported = false;
  let out = '';
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code === 10 || code === 13 || (code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
      out += normalized[i];
    } else {
      replacedUnsupported = true;
      out += '?';
    }
  }
  return { text: out, replacedUnsupported };
}

/**
 * Parse a user-entered currency or numeric string into a finite number (defaults to 0).
 */
export function parseUsdAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[$,\s%]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatUsd(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Detect accidental entry of SSNs, payment card numbers, or banking PINs/passwords.
 */
export function detectSensitiveCredentialInput(values: Record<string, string>): string[] {
  const warnings: string[] = [];
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
  const cardRegex = /\b(?:\d[ -]*?){13,19}\b/;

  for (const [key, val] of Object.entries(values)) {
    if (!val || !val.trim()) continue;
    if (ssnRegex.test(val)) {
      warnings.push(
        `Field "${key}" resembles a Social Security Number (XXX-XX-XXXX). Remove SSNs—helper forms should never store government tax IDs.`
      );
    } else if (cardRegex.test(val.trim())) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
        warnings.push(
          `Field "${key}" resembles a payment card or full bank account number. Replace with a non-sensitive nickname instead.`
        );
      }
    }
  }
  return warnings;
}

/**
 * Compute live USD totals and validation checks for each of the 5 financial templates.
 */
export function computeFinancialSummary(
  templateId: FinancialTemplateId,
  values: Record<string, string>
): FinancialSummaryMetric[] {
  switch (templateId) {
    case 'personal-financial-information': {
      const totalAssets =
        parseUsdAmount(values.cashCheckingSavings) +
        parseUsdAmount(values.retirementAccounts) +
        parseUsdAmount(values.marketableSecurities) +
        parseUsdAmount(values.realEstateEstimatedValue);
      const totalLiabilities =
        parseUsdAmount(values.mortgageBalance) +
        parseUsdAmount(values.autoAndInstallmentLoans) +
        parseUsdAmount(values.revolvingCreditBalances) +
        parseUsdAmount(values.studentLoansBalance);
      const netWorth = totalAssets - totalLiabilities;
      return [
        { label: 'Total Assets (USD)', value: formatUsd(totalAssets), tone: 'neutral' },
        { label: 'Total Liabilities (USD)', value: formatUsd(totalLiabilities), tone: 'neutral' },
        {
          label: 'Estimated Net Worth (USD)',
          value: formatUsd(netWorth),
          tone: netWorth >= 0 ? 'positive' : 'negative',
        },
      ];
    }

    case 'income-and-expense-statement': {
      const totalIncome =
        parseUsdAmount(values.grossSalaryWages) +
        parseUsdAmount(values.freelance1099Income) +
        parseUsdAmount(values.rentalAndInvestmentIncome);
      const totalOutflows =
        parseUsdAmount(values.payrollIncomeTaxes) +
        parseUsdAmount(values.housingRentOrMortgage) +
        parseUsdAmount(values.utilitiesAndInsurance) +
        parseUsdAmount(values.foodTransportationDebt);
      const netCashFlow = totalIncome - totalOutflows;
      return [
        { label: 'Total Gross Income (USD)', value: formatUsd(totalIncome), tone: 'neutral' },
        { label: 'Taxes & Expenses (USD)', value: formatUsd(totalOutflows), tone: 'neutral' },
        {
          label: 'Net Cash Flow (USD)',
          value: formatUsd(netCashFlow),
          tone: netCashFlow >= 0 ? 'positive' : 'negative',
        },
      ];
    }

    case 'monthly-budget': {
      const netIncome = parseUsdAmount(values.netTakeHomePay);
      const totalAllocated =
        parseUsdAmount(values.housingPlanned) +
        parseUsdAmount(values.groceriesPlanned) +
        parseUsdAmount(values.transportAndFuel) +
        parseUsdAmount(values.emergencyAndRetirement) +
        parseUsdAmount(values.extraDebtPaydown);
      const remaining = netIncome - totalAllocated;
      return [
        { label: 'Net Take-Home Pay (USD)', value: formatUsd(netIncome), tone: 'neutral' },
        { label: 'Planned Allocations (USD)', value: formatUsd(totalAllocated), tone: 'neutral' },
        {
          label: remaining >= 0 ? 'Unallocated Surplus (USD)' : 'Over-Budget Deficit (USD)',
          value: formatUsd(remaining),
          tone: remaining >= 0 ? 'positive' : 'negative',
        },
      ];
    }

    case 'business-financial-information': {
      const revenue = parseUsdAmount(values.grossReceiptsSales);
      const costs =
        parseUsdAmount(values.costOfGoodsSold) +
        parseUsdAmount(values.payrollAndBenefits) +
        parseUsdAmount(values.rentOverheadUtilities);
      const operatingNet = revenue - costs;
      const liquidPosition =
        parseUsdAmount(values.operatingCashBalance) +
        parseUsdAmount(values.accountsReceivable) -
        parseUsdAmount(values.businessDebtBalance);
      return [
        { label: 'Gross Revenue (USD)', value: formatUsd(revenue), tone: 'neutral' },
        {
          label: 'Net Operating Snapshot (USD)',
          value: formatUsd(operatingNet),
          tone: operatingNet >= 0 ? 'positive' : 'negative',
        },
        {
          label: 'Cash + A/R Minus Debt (USD)',
          value: formatUsd(liquidPosition),
          tone: liquidPosition >= 0 ? 'positive' : 'warning',
        },
      ];
    }

    case 'beneficiary-information': {
      const primaryPct = parseUsdAmount(values.primarySharePercent);
      const contingentPct = parseUsdAmount(values.contingentSharePercent);
      return [
        {
          label: 'Primary Allocation',
          value: `${primaryPct}%`,
          tone: primaryPct === 100 ? 'positive' : primaryPct > 0 ? 'warning' : 'neutral',
        },
        {
          label: 'Contingent Allocation',
          value: values.contingentFullName?.trim() ? `${contingentPct}%` : 'Not specified',
          tone:
            !values.contingentFullName?.trim()
              ? 'neutral'
              : contingentPct === 100
                ? 'positive'
                : 'warning',
        },
      ];
    }
  }
}

export function validateFinancialFormValues(
  template: FinancialTemplateMeta,
  values: Record<string, string>
): string[] {
  const errors: string[] = [];

  for (const section of template.sections) {
    for (const field of section.fields) {
      const raw = (values[field.key] ?? '').trim();
      if (field.required && !raw) {
        errors.push(`"${field.label}" is required.`);
        continue;
      }
      if (!raw) continue;

      if (field.type === 'currency' || field.type === 'number') {
        const cleaned = raw.replace(/[$,\s]/g, '');
        const num = Number(cleaned);
        if (!Number.isFinite(num)) {
          errors.push(`"${field.label}" must be a valid USD amount.`);
        } else if (num < 0) {
          errors.push(`"${field.label}" cannot be negative.`);
        }
      } else if (field.type === 'percentage') {
        const cleaned = raw.replace(/[%\s]/g, '');
        const pct = Number(cleaned);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
          errors.push(`"${field.label}" must be a percentage between 0 and 100.`);
        }
      }
    }
  }

  return errors;
}

function formatFieldDisplayValue(
  type: FinancialTemplateMeta['sections'][number]['fields'][number]['type'],
  raw: string | undefined,
  isRtlWorksheet: boolean,
  arabicOptionMap?: Record<string, string>
): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return isRtlWorksheet ? '— (غير محدد)' : '— (Not provided)';
  if (type === 'currency') {
    return formatUsd(parseUsdAmount(trimmed));
  }
  if (type === 'percentage') {
    const num = parseUsdAmount(trimmed);
    return `${num}%`;
  }
  if (isRtlWorksheet && arabicOptionMap && arabicOptionMap[trimmed]) {
    return `${arabicOptionMap[trimmed]} (${trimmed})`;
  }
  return trimmed;
}

/**
 * Synthesize a print-ready US Letter or A4 PDF directly in browser RAM via pdf-lib + fontkit.
 * Supports full Arabic shaping, RTL layout, and mixed Arabic/English/USD rendering via Noto Sans Arabic + Noto Sans.
 */
export async function generateFinancialFormPdf(
  options: GenerateFinancialFormPdfOptions
): Promise<ProcessingResult> {
  const {
    template,
    values,
    paperSize,
    worksheetLanguage = 'en',
    includeBlankOptionalFields = true,
    customNotes,
    customFonts,
  } = options;

  const validationErrors = validateFinancialFormValues(template, values);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors[0]);
  }

  const credentialWarnings = detectSensitiveCredentialInput(values);
  if (credentialWarnings.length > 0) {
    throw new Error(credentialWarnings[0]);
  }

  const isRtl = worksheetLanguage === 'ar';
  const arTpl = isRtl ? FINANCIAL_TEMPLATES_AR[template.id] : undefined;
  const dims = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.letter;

  const pdfDoc = await PDFDocument.create();
  const titleStr = isRtl ? `${arTpl?.name || template.name} - ورقة عمل مساعدة` : `${template.name} – Helper Worksheet`;
  pdfDoc.setTitle(titleStr);
  pdfDoc.setProducer('PDFQuick Client-Side Form Engine');
  pdfDoc.setCreator('PDFQuick');

  const fonts = await embedMultilingualPdfFonts(pdfDoc, customFonts);

  const marginX = 44;
  const topMargin = 44;
  const bottomMargin = 52;
  const contentWidth = dims.width - marginX * 2;

  const createdPages: PDFPage[] = [];
  let page = pdfDoc.addPage([dims.width, dims.height]);
  createdPages.push(page);
  let cursorY = dims.height - topMargin;

  const templateDisplayName = isRtl && arTpl ? arTpl.name : template.name;

  const startContinuationPage = () => {
    page = pdfDoc.addPage([dims.width, dims.height]);
    createdPages.push(page);
    cursorY = dims.height - topMargin;

    const contText = isRtl
      ? `${templateDisplayName} (يتبع)`
      : `${template.name} (Continued)`;
    const contDir = isRtl ? 'rtl' : 'ltr';
    drawVisualPdfLine(page, shapeLogicalLineForPdf(contText, contDir, fonts), fonts, {
      x: marginX,
      y: cursorY,
      maxWidth: contentWidth,
      size: 10,
      bold: true,
      color: rgb(0.15, 0.23, 0.36),
      align: isRtl ? 'right' : 'left',
      dir: contDir,
    });
    page.drawLine({
      start: { x: marginX, y: cursorY - 6 },
      end: { x: dims.width - marginX, y: cursorY - 6 },
      thickness: 0.75,
      color: rgb(0.82, 0.86, 0.91),
    });
    cursorY -= 24;
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < bottomMargin) {
      startContinuationPage();
    }
  };

  // Top Banner Header
  const headerHeight = 64;
  page.drawRectangle({
    x: marginX,
    y: cursorY - headerHeight,
    width: contentWidth,
    height: headerHeight,
    color: rgb(0.08, 0.14, 0.26),
  });

  const bannerKicker = isRtl
    ? 'ورقة عمل مالية مساعدة — PDFQuick'
    : 'PDFQUICK FINANCIAL HELPER WORKSHEET';
  drawVisualPdfLine(page, shapeLogicalLineForPdf(bannerKicker, isRtl ? 'rtl' : 'ltr', fonts), fonts, {
    x: marginX + 14,
    y: cursorY - 18,
    maxWidth: contentWidth - 28,
    size: 8.5,
    bold: true,
    color: rgb(0.56, 0.76, 0.98),
    align: isRtl ? 'right' : 'left',
    dir: isRtl ? 'rtl' : 'ltr',
  });

  drawVisualPdfLine(
    page,
    shapeLogicalLineForPdf(templateDisplayName, isRtl ? 'rtl' : 'ltr', fonts),
    fonts,
    {
      x: marginX + 14,
      y: cursorY - 38,
      maxWidth: contentWidth - 28,
      size: 15.5,
      bold: true,
      color: rgb(1, 1, 1),
      align: isRtl ? 'right' : 'left',
      dir: isRtl ? 'rtl' : 'ltr',
    }
  );

  const dateStamp = new Date().toISOString().slice(0, 10);
  const metaLabel = isRtl
    ? `${dims.labelAr}  |  العملة: USD  |  التاريخ: ${dateStamp}`
    : `${dims.label}  |  Currency: USD  |  Prepared: ${dateStamp}`;
  drawVisualPdfLine(page, shapeLogicalLineForPdf(metaLabel, isRtl ? 'rtl' : 'ltr', fonts), fonts, {
    x: marginX + 14,
    y: cursorY - 54,
    maxWidth: contentWidth - 28,
    size: 8.3,
    bold: false,
    color: rgb(0.82, 0.87, 0.94),
    align: isRtl ? 'right' : 'left',
    dir: isRtl ? 'rtl' : 'ltr',
  });

  cursorY -= headerHeight + 12;

  // Non-official Disclaimer Box
  const disclaimerText = isRtl ? ARABIC_HELPER_DISCLAIMER : HELPER_TEMPLATE_DISCLAIMER;
  const disclaimerLines = wrapMultilingualText(
    disclaimerText,
    8.2,
    contentWidth - 20,
    false,
    fonts,
    isRtl ? 'rtl' : 'ltr'
  );
  const disclaimerBoxH = disclaimerLines.length * 12 + 14;
  page.drawRectangle({
    x: marginX,
    y: cursorY - disclaimerBoxH,
    width: contentWidth,
    height: disclaimerBoxH,
    color: rgb(0.996, 0.97, 0.9),
    borderColor: rgb(0.92, 0.76, 0.42),
    borderWidth: 0.75,
  });

  let dy = cursorY - 14;
  for (const line of disclaimerLines) {
    drawVisualPdfLine(page, line.visual, fonts, {
      x: marginX + 10,
      y: dy,
      maxWidth: contentWidth - 20,
      size: 8.2,
      bold: false,
      color: rgb(0.42, 0.25, 0.04),
      align: isRtl ? 'right' : 'left',
      dir: line.dir,
    });
    dy -= 12;
  }
  cursorY -= disclaimerBoxH + 14;

  // Computed USD Summary Box
  const metrics = computeFinancialSummary(template.id, values);
  if (metrics.length > 0) {
    const summaryH = 46;
    ensureSpace(summaryH + 14);
    page.drawRectangle({
      x: marginX,
      y: cursorY - summaryH,
      width: contentWidth,
      height: summaryH,
      color: rgb(0.95, 0.97, 1),
      borderColor: rgb(0.78, 0.85, 0.95),
      borderWidth: 0.75,
    });

    const colW = contentWidth / metrics.length;
    const orderedMetrics = isRtl ? [...metrics].reverse() : metrics;
    orderedMetrics.forEach((metric, idx) => {
      const colX = marginX + idx * colW + 10;
      const metricLabel = isRtl ? translateSummaryLabelAr(metric.label) : metric.label;
      const metricVal =
        isRtl && metric.value === 'Not specified' ? translateSummaryLabelAr(metric.value) : metric.value;
      const metricDir = isRtl ? 'rtl' : 'ltr';

      drawVisualPdfLine(page, shapeLogicalLineForPdf(metricLabel, metricDir, fonts), fonts, {
        x: colX,
        y: cursorY - 15,
        maxWidth: colW - 20,
        size: 7.8,
        bold: false,
        color: rgb(0.32, 0.39, 0.49),
        align: isRtl ? 'right' : 'left',
        dir: metricDir,
      });

      const valColor =
        metric.tone === 'positive'
          ? rgb(0.05, 0.48, 0.27)
          : metric.tone === 'negative'
            ? rgb(0.74, 0.14, 0.14)
            : rgb(0.09, 0.14, 0.24);

      drawVisualPdfLine(
        page,
        shapeLogicalLineForPdf(metricVal, containsArabicScript(metricVal) ? 'rtl' : 'ltr', fonts),
        fonts,
        {
          x: colX,
          y: cursorY - 33,
          maxWidth: colW - 20,
          size: 11.5,
          bold: true,
          color: valColor,
          align: isRtl ? 'right' : 'left',
          dir: containsArabicScript(metricVal) ? 'rtl' : 'ltr',
        }
      );
    });

    cursorY -= summaryH + 16;
  }

  // Render Each Section & Typed Fields
  for (const section of template.sections) {
    const visibleFields = section.fields.filter((f) => {
      if (includeBlankOptionalFields) return true;
      return f.required || Boolean((values[f.key] || '').trim());
    });
    if (visibleFields.length === 0) continue;

    ensureSpace(46);

    const arSec = arTpl?.sections[section.id];
    const secTitle = isRtl && arSec ? arSec.title : section.title;
    const secDesc = isRtl && arSec ? arSec.description : section.description;

    // Section Title Bar
    page.drawRectangle({
      x: marginX,
      y: cursorY - 23,
      width: contentWidth,
      height: 23,
      color: rgb(0.93, 0.95, 0.98),
    });
    drawVisualPdfLine(page, shapeLogicalLineForPdf(secTitle, isRtl ? 'rtl' : 'ltr', fonts), fonts, {
      x: marginX + 10,
      y: cursorY - 16,
      maxWidth: contentWidth - 20,
      size: 10.5,
      bold: true,
      color: rgb(0.1, 0.16, 0.28),
      align: isRtl ? 'right' : 'left',
      dir: isRtl ? 'rtl' : 'ltr',
    });
    cursorY -= 27;

    const descLines = wrapMultilingualText(
      secDesc,
      8.2,
      contentWidth - 12,
      false,
      fonts,
      isRtl ? 'rtl' : 'ltr'
    );
    for (const dLine of descLines) {
      ensureSpace(13);
      drawVisualPdfLine(page, dLine.visual, fonts, {
        x: marginX + 6,
        y: cursorY - 7,
        maxWidth: contentWidth - 12,
        size: 8.2,
        bold: false,
        color: rgb(0.38, 0.44, 0.53),
        align: isRtl ? 'right' : 'left',
        dir: dLine.dir,
      });
      cursorY -= 12;
    }
    cursorY -= 5;

    const labelColWidth = contentWidth * 0.46;
    const valueColWidth = contentWidth - labelColWidth - 20;

    // In LTR: Label on Left, Value on Right. In RTL: Value on Left, Label on Right.
    const labelColX = isRtl ? marginX + valueColWidth + 12 : marginX + 8;
    const valueColX = isRtl ? marginX + 8 : marginX + labelColWidth + 12;

    for (let fIdx = 0; fIdx < visibleFields.length; fIdx++) {
      const field = visibleFields[fIdx];
      const arField = arTpl?.fields[field.key];
      const fieldLabel = isRtl && arField ? arField.label : field.label;
      const displayVal = formatFieldDisplayValue(field.type, values[field.key], isRtl, arField?.options);

      const labelLines = wrapMultilingualText(
        fieldLabel,
        9.2,
        labelColWidth - 12,
        true,
        fonts,
        isRtl ? 'rtl' : 'ltr'
      );
      const valHasArabic = containsArabicScript(displayVal);
      const valLines = wrapMultilingualText(
        displayVal,
        9.5,
        valueColWidth,
        false,
        fonts,
        valHasArabic ? 'rtl' : 'auto'
      );

      const rowLines = Math.max(labelLines.length, valLines.length);
      const rowHeight = Math.max(24, rowLines * 13.5 + 9);

      ensureSpace(rowHeight + 4);

      if (fIdx % 2 === 1) {
        page.drawRectangle({
          x: marginX,
          y: cursorY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.985, 0.99, 0.995),
        });
      }

      let ly = cursorY - 15;
      for (const lLine of labelLines) {
        drawVisualPdfLine(page, lLine.visual, fonts, {
          x: labelColX,
          y: ly,
          maxWidth: labelColWidth - 12,
          size: 9.2,
          bold: true,
          color: rgb(0.18, 0.24, 0.34),
          align: isRtl ? 'right' : 'left',
          dir: lLine.dir,
        });
        ly -= 13.5;
      }

      let vy = cursorY - 15;
      const isEmpty = !(values[field.key] ?? '').trim();
      for (const vLine of valLines) {
        drawVisualPdfLine(page, vLine.visual, fonts, {
          x: valueColX,
          y: vy,
          maxWidth: valueColWidth,
          size: 9.5,
          bold: false,
          color: isEmpty ? rgb(0.55, 0.6, 0.68) : rgb(0.06, 0.09, 0.16),
          align: isRtl || vLine.dir === 'rtl' ? 'right' : 'left',
          dir: vLine.dir,
        });
        vy -= 13.5;
      }

      page.drawLine({
        start: { x: marginX, y: cursorY - rowHeight },
        end: { x: dims.width - marginX, y: cursorY - rowHeight },
        thickness: 0.4,
        color: rgb(0.88, 0.9, 0.93),
      });

      cursorY -= rowHeight;
    }

    cursorY -= 14;
  }

  // Optional Preparer Notes Section
  if (customNotes && customNotes.trim()) {
    const notesHasArabic = containsArabicScript(customNotes);
    const notesDir = isRtl || notesHasArabic ? 'rtl' : 'ltr';
    const noteLines = wrapMultilingualText(
      customNotes.trim(),
      9.2,
      contentWidth - 20,
      false,
      fonts,
      notesDir
    );
    const notesH = 26 + noteLines.length * 13.5 + 12;
    ensureSpace(notesH);

    page.drawRectangle({
      x: marginX,
      y: cursorY - 22,
      width: contentWidth,
      height: 22,
      color: rgb(0.93, 0.95, 0.98),
    });

    const notesHeading = isRtl ? 'ملاحظات معدّ النموذج' : 'Preparer Notes';
    drawVisualPdfLine(page, shapeLogicalLineForPdf(notesHeading, isRtl ? 'rtl' : 'ltr', fonts), fonts, {
      x: marginX + 10,
      y: cursorY - 15,
      maxWidth: contentWidth - 20,
      size: 10.5,
      bold: true,
      color: rgb(0.1, 0.16, 0.28),
      align: isRtl ? 'right' : 'left',
      dir: isRtl ? 'rtl' : 'ltr',
    });
    cursorY -= 32;

    for (const line of noteLines) {
      ensureSpace(14);
      drawVisualPdfLine(page, line.visual, fonts, {
        x: marginX + 8,
        y: cursorY,
        maxWidth: contentWidth - 16,
        size: 9.2,
        bold: false,
        color: rgb(0.15, 0.2, 0.28),
        align: line.dir === 'rtl' ? 'right' : 'left',
        dir: line.dir,
      });
      cursorY -= 13.5;
    }
  }

  // Page Footers across all generated pages
  const totalPages = createdPages.length;
  createdPages.forEach((p, idx) => {
    const footerText = isRtl
      ? `صفحة ${idx + 1} من ${totalPages}  |  ورقة عمل مساعدة فقط (ليست نموذجاً بنكياً رسمياً)  |  تم الإنشاء محلياً عبر PDFQuick`
      : `Page ${idx + 1} of ${totalPages}  |  Helper Worksheet Only (Not an Official Bank Form)  |  Processed Locally via PDFQuick`;
    p.drawLine({
      start: { x: marginX, y: 34 },
      end: { x: dims.width - marginX, y: 34 },
      thickness: 0.5,
      color: rgb(0.84, 0.87, 0.91),
    });
    drawVisualPdfLine(p, shapeLogicalLineForPdf(footerText, isRtl ? 'rtl' : 'ltr', fonts), fonts, {
      x: marginX,
      y: 20,
      maxWidth: contentWidth,
      size: 7.7,
      bold: false,
      color: rgb(0.45, 0.5, 0.58),
      align: isRtl ? 'right' : 'left',
      dir: isRtl ? 'rtl' : 'ltr',
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const slugPaper = paperSize === 'a4' ? 'a4' : 'us-letter';
  const langSuffix = isRtl ? '-ar' : '';
  const downloadName = `pdfquick-${template.id}-${slugPaper}${langSuffix}.pdf`;

  return {
    blob,
    downloadName,
    fileSize: blob.size,
    pageCount: totalPages,
    message: isRtl
      ? `تم إنشاء ملف PDF جاهز للطباعة (${dims.labelAr}، ${totalPages} صفحة) مع دعم كامل للخط العربي محلياً داخل متصفحك.`
      : `Generated print-ready ${dims.label} worksheet (${totalPages} page${totalPages > 1 ? 's' : ''}) strictly inside your browser.`,
  };
}
