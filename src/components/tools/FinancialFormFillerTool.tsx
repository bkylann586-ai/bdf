import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  Printer,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FINANCIAL_TEMPLATES, HELPER_TEMPLATE_DISCLAIMER } from '../../lib/financialTemplates';
import {
  ARABIC_HELPER_DISCLAIMER,
  FINANCIAL_TEMPLATES_AR,
  translateSummaryLabelAr,
} from '../../lib/financialTemplatesAr';
import {
  FinancialPaperSize,
  WorksheetPdfLanguage,
  computeFinancialSummary,
  detectSensitiveCredentialInput,
  formatUsd,
  generateFinancialFormPdf,
  parseUsdAmount,
  validateFinancialFormValues,
} from '../../lib/financialFormPdf';
import { FinancialTemplateId, ProcessingResult } from '../../types';
import { downloadBlob, formatBytes, openUnencryptedPdfJsDocument, renderPdfPageToCanvas } from '../../lib/pdfUtils';
import { trackToolError, trackToolStart, trackToolSuccess } from '../../lib/analytics';
import { useTranslation } from '../../lib/i18n';
import { usePerformanceMonitor } from '../../lib/performanceMonitor';
import { PerformanceMonitor } from '../PerformanceMonitor';

const SAMPLE_VALUES: Record<FinancialTemplateId, Record<string, string>> = {
  'personal-financial-information': {
    fullLegalName: 'Jordan M. Taylor',
    statementAsOfDate: '2026-11-01',
    mailingAddress: '742 Maple Crest Ave, Austin, TX 78704',
    contactPhone: '(555) 014-8920',
    cashCheckingSavings: '28500',
    retirementAccounts: '84000',
    marketableSecurities: '16200',
    realEstateEstimatedValue: '340000',
    mortgageBalance: '215000',
    autoAndInstallmentLoans: '8400',
    revolvingCreditBalances: '1250',
    studentLoansBalance: '11500',
  },
  'income-and-expense-statement': {
    preparerName: 'Jordan M. Taylor',
    reportingBasis: 'Monthly Average',
    periodRange: 'Jan 1, 2026 - Oct 31, 2026',
    grossSalaryWages: '7200',
    freelance1099Income: '950',
    rentalAndInvestmentIncome: '320',
    payrollIncomeTaxes: '1620',
    housingRentOrMortgage: '2150',
    utilitiesAndInsurance: '640',
    foodTransportationDebt: '1280',
  },
  'monthly-budget': {
    budgetMonth: 'November 2026',
    netTakeHomePay: '5850',
    housingPlanned: '2150',
    groceriesPlanned: '680',
    transportAndFuel: '410',
    emergencyAndRetirement: '900',
    extraDebtPaydown: '300',
    budgetNotes: 'Includes annual auto registration reserve ($120) and seasonal utility buffer.',
  },
  'business-financial-information': {
    businessLegalName: 'Summit Ridge Logistics LLC',
    entityStructure: 'LLC',
    fiscalPeriod: 'FY 2026 Q1-Q3',
    grossReceiptsSales: '418000',
    costOfGoodsSold: '164000',
    payrollAndBenefits: '102000',
    rentOverheadUtilities: '43500',
    operatingCashBalance: '54200',
    accountsReceivable: '28400',
    businessDebtBalance: '32000',
  },
  'beneficiary-information': {
    accountOwnerName: 'Jordan M. Taylor',
    accountReferenceNickname: 'Primary Household Savings - Planning Sheet',
    primaryFullName: 'Alex R. Taylor',
    primaryRelationship: 'Spouse',
    primarySharePercent: '100',
    primaryContactAddress: '742 Maple Crest Ave, Austin, TX 78704',
    contingentFullName: 'Morgan K. Taylor',
    contingentSharePercent: '100',
  },
};

export const FinancialFormFillerTool: React.FC = () => {
  const { t, language } = useTranslation();
  const { startRun, finishRun } = usePerformanceMonitor();

  const initialTemplateId = useMemo<FinancialTemplateId>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramTpl = params.get('template') as FinancialTemplateId | null;
      if (paramTpl && FINANCIAL_TEMPLATES.some((tpl) => tpl.id === paramTpl)) {
        return paramTpl;
      }
    }
    return 'personal-financial-information';
  }, []);

  const [selectedId, setSelectedId] = useState<FinancialTemplateId>(initialTemplateId);
  const [paperSize, setPaperSize] = useState<FinancialPaperSize>('letter');
  const [worksheetLanguage, setWorksheetLanguage] = useState<WorksheetPdfLanguage>(
    language === 'ar' ? 'ar' : 'en'
  );
  const [includeBlankOptionalFields, setIncludeBlankOptionalFields] = useState<boolean>(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<ProcessingResult | null>(null);

  // Real PDF Page Preview state rendered via PDF.js on canvas
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTotalPages, setPreviewTotalPages] = useState(0);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeTemplate = useMemo(
    () => FINANCIAL_TEMPLATES.find((tpl) => tpl.id === selectedId) || FINANCIAL_TEMPLATES[0],
    [selectedId]
  );

  const summaryMetrics = useMemo(
    () => computeFinancialSummary(activeTemplate.id, values),
    [activeTemplate.id, values]
  );

  const credentialWarnings = useMemo(() => detectSensitiveCredentialInput(values), [values]);

  // Cleanup generated canvas buffers on unmount or template switch
  useEffect(() => {
    return () => {
      if (previewCanvasRef.current) {
        previewCanvasRef.current.width = 0;
        previewCanvasRef.current.height = 0;
      }
    };
  }, []);

  // Render synthesized PDF bytes onto preview canvas when generatedResult changes
  useEffect(() => {
    let cancelled = false;
    const renderGeneratedPreview = async () => {
      if (!generatedResult || typeof document === 'undefined') return;
      setIsRenderingPreview(true);
      try {
        const buf = await generatedResult.blob.arrayBuffer();
        const { doc, cleanup } = await openUnencryptedPdfJsDocument(buf);
        try {
          if (cancelled) return;
          setPreviewTotalPages(doc.numPages);
          const safePage = Math.max(1, Math.min(previewPage, doc.numPages));
          if (safePage !== previewPage) {
            setPreviewPage(safePage);
          }
          const renderedCanvas = await renderPdfPageToCanvas(doc, safePage, 1.35);
          if (!cancelled && previewCanvasRef.current) {
            const target = previewCanvasRef.current;
            target.width = renderedCanvas.width;
            target.height = renderedCanvas.height;
            const ctx = target.getContext('2d');
            if (ctx) {
              ctx.drawImage(renderedCanvas, 0, 0);
            }
          }
          renderedCanvas.width = 0;
          renderedCanvas.height = 0;
        } finally {
          await cleanup();
        }
      } catch (err) {
        console.warn('PDF preview render warning:', err);
      } finally {
        if (!cancelled) setIsRenderingPreview(false);
      }
    };

    renderGeneratedPreview();
    return () => {
      cancelled = true;
    };
  }, [generatedResult, previewPage]);

  const handleSelectTemplate = (id: FinancialTemplateId) => {
    setSelectedId(id);
    setValues({});
    setCustomNotes('');
    setGeneratedResult(null);
    setErrorMsg(null);
    setPreviewPage(1);
    setPreviewTotalPages(0);
  };

  const handleFieldChange = (key: string, val: string) => {
    setErrorMsg(null);
    setGeneratedResult(null);
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleFillSample = () => {
    setErrorMsg(null);
    setGeneratedResult(null);
    setValues({ ...(SAMPLE_VALUES[activeTemplate.id] || {}) });
  };

  const handleClearAll = () => {
    setErrorMsg(null);
    setGeneratedResult(null);
    setValues({});
    setCustomNotes('');
    setPreviewPage(1);
    setPreviewTotalPages(0);
  };

  const handleGeneratePdf = async () => {
    setErrorMsg(null);
    const validationErrors = validateFinancialFormValues(activeTemplate, values);
    if (validationErrors.length > 0) {
      setErrorMsg(validationErrors[0]);
      return;
    }
    if (credentialWarnings.length > 0) {
      setErrorMsg(credentialWarnings[0]);
      return;
    }

    const startedAt = Date.now();
    trackToolStart('financial-pdf-form-filler');
    startRun({ operationName: t('banking.formFillerTitle') });
    setIsGenerating(true);

    try {
      const result = await generateFinancialFormPdf({
        template: activeTemplate,
        values,
        paperSize,
        worksheetLanguage,
        includeBlankOptionalFields,
        customNotes,
      });
      finishRun({ outputBytes: result.fileSize });
      setPreviewPage(1);
      setGeneratedResult(result);
      trackToolSuccess('financial-pdf-form-filler', {
        durationMs: Date.now() - startedAt,
        pageCount: result.pageCount,
      });
    } catch (err: any) {
      finishRun();
      const msg = err?.message || 'Failed to generate helper PDF worksheet.';
      setErrorMsg(msg);
      trackToolError('financial-pdf-form-filler', err?.name || 'FormPdfError');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedResult) return;
    downloadBlob(generatedResult.blob, generatedResult.downloadName);
  };

  const handlePrintPdf = () => {
    if (!generatedResult || typeof window === 'undefined') return;
    const url = URL.createObjectURL(generatedResult.blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // Fallback if browser blocks iframe print
        downloadBlob(generatedResult.blob, generatedResult.downloadName);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(url);
      }, 60_000);
    };
  };

  return (
    <div className="w-full space-y-6">
      {/* Legal & Privacy Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-950 leading-relaxed space-y-1">
          <p className="font-semibold">{HELPER_TEMPLATE_DISCLAIMER}</p>
          <p className="text-xs text-amber-900">
            Never enter Social Security Numbers (SSNs), debit/credit card numbers, PINs, or online banking passwords. All inputs live purely in volatile browser tab RAM and clear automatically when you close or reset this page.
          </p>
        </div>
      </div>

      {/* Template Selector Tabs */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <h2 className="text-sm font-bold text-[#102A56] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
            <span>1. Choose Financial Helper Worksheet</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#2563EB]/25 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Sample Data</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#17243A] bg-[#F4F7FB] hover:bg-[#E2E8F0]/60 border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {FINANCIAL_TEMPLATES.map((tpl) => {
            const active = tpl.id === activeTemplate.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`text-start p-3 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-[#102A56] text-white border-[#102A56] shadow-xs'
                    : 'bg-[#F4F7FB] text-[#17243A] border-[#E2E8F0] hover:border-[#2563EB] hover:bg-white'
                }`}
              >
                <div className="text-xs font-bold leading-snug mb-1">{tpl.name}</div>
                <div className={`text-[11px] ${active ? 'text-[#38BDF8]' : 'text-[#64748B]'}`}>
                  {tpl.sections.reduce((acc, s) => acc + s.fields.length, 0)} fields · USD
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Interactive Fields + Live Preview & PDF Export */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Form Fields */}
        <div className="lg:col-span-7 space-y-5">
          {/* Paper Standard & Output Settings */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#102A56]">
                2. Paper Size &amp; Print Settings
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                <ShieldCheck className="w-3 h-3" />
                Zero Cloud Storage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaperSize('letter');
                  setGeneratedResult(null);
                }}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  paperSize === 'letter'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#102A56]'
                    : 'bg-white border-[#E2E8F0] text-[#17243A] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">{t('banking.paperLetter')}</div>
                <div className="text-[11px] text-[#64748B]">Default US Banking &amp; Mortgage Print Size</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaperSize('a4');
                  setGeneratedResult(null);
                }}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                  paperSize === 'a4'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#102A56]'
                    : 'bg-white border-[#E2E8F0] text-[#17243A] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">{t('banking.paperA4')}</div>
                <div className="text-[11px] text-[#64748B]">International UK / EU / Global Print Size</div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setWorksheetLanguage('en');
                  setGeneratedResult(null);
                }}
                className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                  worksheetLanguage === 'en'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#102A56]'
                    : 'bg-white border-[#E2E8F0] text-[#17243A] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">PDF Output: English (LTR)</div>
                <div className="text-[11px] text-[#64748B]">US Standard headings (supports Arabic field entries)</div>
              </button>

              <button
                type="button"
                dir="rtl"
                onClick={() => {
                  setWorksheetLanguage('ar');
                  setGeneratedResult(null);
                }}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  worksheetLanguage === 'ar'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-[#102A56]'
                    : 'bg-white border-[#E2E8F0] text-[#17243A] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="text-xs font-bold">لغة ملف الـ PDF: العربية (RTL)</div>
                <div className="text-[11px] text-[#64748B]">تخطيط عربي كامل مع خط Noto Sans Arabic ونصوص مختلطة</div>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#17243A] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeBlankOptionalFields}
                onChange={(e) => {
                  setIncludeBlankOptionalFields(e.target.checked);
                  setGeneratedResult(null);
                }}
                className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Include blank optional fields cleanly in exported PDF</span>
            </label>
          </div>

          {/* Form Sections */}
          {activeTemplate.sections.map((section) => (
            <div key={section.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-4">
              <div className="border-b border-[#E2E8F0] pb-2.5">
                <h3 className="text-sm font-bold text-[#102A56]">{section.title}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{section.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.fields.map((field) => {
                  const val = values[field.key] ?? '';
                  const isWide = field.type === 'textarea' || field.key.toLowerCase().includes('address');
                  return (
                    <div key={field.key} className={isWide ? 'sm:col-span-2' : ''}>
                      <label
                        htmlFor={`fld-${field.key}`}
                        className="block text-xs font-semibold text-[#17243A] mb-1.5"
                      >
                        {field.label}
                        {field.required && <span className="text-red-600 ms-0.5">*</span>}
                        {field.sensitivity === 'pii-caution' && (
                          <span className="ms-1.5 text-[10px] font-normal text-amber-700">
                            (RAM-only)
                          </span>
                        )}
                      </label>

                      {field.type === 'select' && field.options ? (
                        <select
                          id={`fld-${field.key}`}
                          value={val}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2 text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                        >
                          <option value="">Select {field.label}...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={`fld-${field.key}`}
                          rows={3}
                          value={val}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.examplePlaceholder}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                        />
                      ) : field.type === 'currency' ? (
                        <div className="relative">
                          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B]">
                            USD $
                          </span>
                          <input
                            id={`fld-${field.key}`}
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.examplePlaceholder.replace('$', '')}
                            className="w-full min-h-[42px] ps-14 pe-3 py-2 text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none tabular-nums"
                          />
                        </div>
                      ) : field.type === 'percentage' ? (
                        <div className="relative">
                          <input
                            id={`fld-${field.key}`}
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            inputMode="numeric"
                            value={val}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.examplePlaceholder.replace('%', '')}
                            className="w-full min-h-[42px] ps-3 pe-8 py-2 text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none tabular-nums"
                          />
                          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B]">
                            %
                          </span>
                        </div>
                      ) : (
                        <input
                          id={`fld-${field.key}`}
                          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                          value={val}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.examplePlaceholder}
                          className="w-full min-h-[42px] px-3 py-2 text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                        />
                      )}

                      {field.validationNote && (
                        <p className="text-[11px] text-[#64748B] mt-1">{field.validationNote}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Optional Notes Box */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
            <label htmlFor="preparer-notes" className="block text-xs font-bold text-[#102A56] mb-1.5">
              Optional Preparer Notes (Printed at bottom of worksheet)
            </label>
            <textarea
              id="preparer-notes"
              rows={2}
              value={customNotes}
              onChange={(e) => {
                setCustomNotes(e.target.value);
                setGeneratedResult(null);
              }}
              placeholder="Optional clarifications for your personal records or CPA review..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
            />
          </div>
        </div>

        {/* Right: Live USD Calculation Summary, Live Preview & Export */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          {/* Computed USD Totals Card */}
          <div className="bg-[#102A56] text-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] mb-3">
              Live Worksheet Summary (USD)
            </h3>
            <div className="space-y-2.5">
              {summaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between py-2 border-b border-white/15 last:border-0 last:pb-0 text-xs"
                >
                  <span className="text-slate-200">{metric.label}</span>
                  <span
                    className={`font-mono font-bold text-sm tabular-nums ${
                      metric.tone === 'positive'
                        ? 'text-emerald-400'
                        : metric.tone === 'negative'
                          ? 'text-red-400'
                          : metric.tone === 'warning'
                            ? 'text-amber-300'
                            : 'text-white'
                    }`}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Credential Safety Warnings */}
          {credentialWarnings.length > 0 && (
            <div role="alert" className="bg-red-50 border border-red-300 rounded-2xl p-4 text-xs text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {credentialWarnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action CTA Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,42,86,0.06)] space-y-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePdf}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] disabled:opacity-60 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : t('banking.formFillerButton')}</span>
            </button>

            {generatedResult && (
              <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Print-Ready PDF Built ({formatBytes(generatedResult.fileSize)})
                  </span>
                  <span className="font-mono">{generatedResult.pageCount} page(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#17243A] bg-[#F4F7FB] hover:bg-[#E2E8F0]/70 border border-[#E2E8F0] rounded-xl cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-[#2563EB]" />
                    <span>Print Worksheet</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratedResult(null)}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#102A56] py-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Keep Editing Fields</span>
                </button>

                <PerformanceMonitor variant="summary" outputBytes={generatedResult.fileSize} />
              </div>
            )}
          </div>

          {/* Document Preview Box (Real Rendered PDF Canvas after Generate, or Live Sheet Preview before Generate) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_1px_3px_rgba(16,42,86,0.06)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 mb-3">
              <span className="text-xs font-bold text-[#102A56]">
                {generatedResult ? 'Rendered PDF Page Preview' : 'Live Worksheet Layout Preview'}
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">
                {paperSize === 'a4' ? 'A4' : 'US Letter'}
              </span>
            </div>

            {generatedResult ? (
              <div className="space-y-3">
                <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-2 flex items-center justify-center overflow-auto max-h-[540px]">
                  <canvas
                    ref={previewCanvasRef}
                    className={`max-w-full h-auto shadow-sm bg-white ${
                      isRenderingPreview ? 'opacity-50' : ''
                    }`}
                  />
                </div>
                {previewTotalPages > 1 && (
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#E2E8F0] rounded-lg bg-white text-[#17243A] hover:bg-[#F4F7FB] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <span className="font-mono text-[#64748B]">
                      Page {previewPage} of {previewTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= previewTotalPages}
                      onClick={() => setPreviewPage((p) => Math.min(previewTotalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#E2E8F0] rounded-lg bg-white text-[#17243A] hover:bg-[#F4F7FB] disabled:opacity-40 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                dir={worksheetLanguage === 'ar' ? 'rtl' : 'ltr'}
                className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-4 text-[11px] space-y-3 max-h-[480px] overflow-y-auto"
              >
                <div className="bg-[#102A56] text-white p-3 rounded-lg">
                  <div className="text-[9px] font-bold text-[#38BDF8] uppercase">
                    {worksheetLanguage === 'ar' ? 'ورقة عمل مساعدة — PDFQuick' : 'PDFQuick Helper Worksheet'}
                  </div>
                  <div className="text-sm font-bold">
                    {worksheetLanguage === 'ar'
                      ? FINANCIAL_TEMPLATES_AR[activeTemplate.id]?.name || activeTemplate.name
                      : activeTemplate.name}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {paperSize === 'a4' ? 'ISO A4' : 'US Letter'} · USD
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[10px] text-amber-900">
                  {worksheetLanguage === 'ar'
                    ? ARABIC_HELPER_DISCLAIMER
                    : 'Helper template only — NOT an official bank or lender form.'}
                </div>
                {worksheetLanguage === 'ar' && (
                  <div className="bg-[#EFF6FF] border border-[#2563EB]/25 rounded-lg p-2 space-y-1">
                    {summaryMetrics.map((m) => (
                      <div key={m.label} className="flex justify-between text-[10px]">
                        <span className="text-[#64748B]">{translateSummaryLabelAr(m.label)}</span>
                        <span className="font-mono font-bold text-[#102A56]">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTemplate.sections.map((sec) => {
                  const arSec = FINANCIAL_TEMPLATES_AR[activeTemplate.id]?.sections[sec.id];
                  return (
                    <div key={sec.id} className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                      <div className="font-bold text-[#102A56] text-[11px] mb-1.5">
                        {worksheetLanguage === 'ar' && arSec ? arSec.title : sec.title}
                      </div>
                      <div className="space-y-1">
                        {sec.fields.map((fld) => {
                          const arFld = FINANCIAL_TEMPLATES_AR[activeTemplate.id]?.fields[fld.key];
                          const raw = (values[fld.key] || '').trim();
                          const shown = !raw
                            ? '—'
                            : fld.type === 'currency'
                              ? formatUsd(parseUsdAmount(raw))
                              : fld.type === 'percentage'
                                ? `${parseUsdAmount(raw)}%`
                                : raw;
                          return (
                            <div
                              key={fld.key}
                              className="flex justify-between gap-2 text-[10px] border-b border-[#F1F5F9] last:border-0 pb-0.5"
                            >
                              <span className="text-[#64748B]">
                                {worksheetLanguage === 'ar' && arFld ? arFld.label : fld.label}
                              </span>
                              <span className="font-medium text-[#17243A] truncate max-w-[160px]" dir="auto">
                                {shown}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
