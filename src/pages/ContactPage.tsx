import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Info,
  Bug,
  Copy,
  Clock,
  Mail,
  Building2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  SeoMeta,
  buildBreadcrumbSchema,
  getProductionBaseUrl,
} from '../components/SeoMeta';
import { getSiteConfig } from '../lib/siteConfig';

export const ContactPage: React.FC = () => {
  const [reportData, setReportData] = useState({
    topic: 'Bug Report (File Processing Issue)',
    tool: 'Merge PDF',
    environment: '',
    details: '',
  });
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const { operator, adsense, monetag } = getSiteConfig();
  const baseUrl = getProductionBaseUrl();

  const formatDiagnosticText = () =>
    [
      `Topic: ${reportData.topic}`,
      `Tool: ${reportData.tool}`,
      `Browser / OS: ${reportData.environment || 'Not specified'}`,
      '',
      'Details:',
      reportData.details.trim() || 'No details entered.',
    ].join('\n');

  const handleCopyDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatDiagnosticText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleCopyEmail = () => {
    if (!operator.supportEmail) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(operator.supportEmail).then(() => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2500);
      });
    }
  };

  const mailtoHref = operator.supportEmail
    ? `mailto:${operator.supportEmail}?subject=${encodeURIComponent(
        `[PDFQuick] ${reportData.topic} – ${reportData.tool}`
      )}&body=${encodeURIComponent(formatDiagnosticText())}`
    : null;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${baseUrl}/contact#webpage`,
        name: 'Contact & Support Information | PDFQuick',
        url: `${baseUrl}/contact`,
        description:
          'Support guidance, technical bug reporting instructions, and operator contact details for PDFQuick client-side PDF utilities.',
      },
      buildBreadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Contact & Support', path: '/contact' },
        ],
        baseUrl
      ),
    ],
  };

  return (
    <div className="flex-1 bg-[#F4F7FB] pb-16">
      <SeoMeta
        title="Contact & Support Information | PDFQuick"
        description="Support guidance, technical bug reporting instructions, and operator contact details for PDFQuick client-side PDF utilities."
        path="/contact"
        schema={schema}
      />

      {/* Editorial Header Band */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-10">
          <Breadcrumbs items={[{ label: 'Contact & Support' }]} />

          <div className="pt-5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A56] tracking-tight mb-2">
              Contact &amp; Support
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] max-w-2xl">
              Support guidance, technical troubleshooting information, and verified operator disclosures for PDFQuick&apos;s browser-based PDF utilities.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info sidebar */}
          <div className="space-y-4 text-sm text-[#64748B]">
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl">
              <h2 className="font-bold text-[#102A56] text-xs mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                <span>Client-Side Architecture</span>
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                PDFQuick runs entirely inside your browser without storing user accounts or document databases on a backend server.
              </p>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl">
              <h3 className="font-bold text-[#102A56] text-xs mb-1.5 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-amber-600" />
                <span>Reporting File Issues</span>
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                When documenting an issue with a PDF file, note your browser (Chrome, Firefox, Safari, Edge), operating system, and exact error message. Never share confidential documents.
              </p>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl">
              <h3 className="font-bold text-[#102A56] text-xs mb-1.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#2563EB]" />
                <span>Privacy Reminder</span>
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                All document processing happens in your device&apos;s RAM. No third party can access or inspect files you open in PDFQuick.
              </p>
            </div>
          </div>

          {/* Operator Contact Disclosure + Local Diagnostic Formatter */}
          <div className="md:col-span-2 space-y-6">
            {operator.supportEmail ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-[#102A56]">
                      Direct Operator Support &amp; Legal Inquiries
                    </h2>
                    <p className="text-xs text-[#17243A] leading-relaxed">
                      Reach the PDFQuick operator directly using the verified contact channel below. Please avoid attaching sensitive PDFs or banking statements to support emails.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white border border-emerald-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-[#64748B] font-semibold mb-1">
                      <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Support Email</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`mailto:${operator.supportEmail}`}
                        className="font-semibold text-[#2563EB] hover:underline break-all"
                      >
                        {operator.supportEmail}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#F4F7FB] hover:bg-[#E2E8F0] text-[#102A56] rounded-md cursor-pointer shrink-0"
                      >
                        {emailCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {operator.legalName && (
                    <div className="bg-white border border-emerald-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-[#64748B] font-semibold mb-1">
                        <Building2 className="w-3.5 h-3.5 text-[#102A56]" />
                        <span>Operator / Publisher</span>
                      </div>
                      <p className="font-semibold text-[#102A56]">{operator.legalName}</p>
                    </div>
                  )}

                  {operator.address && (
                    <div className="bg-white border border-emerald-200 rounded-xl p-3.5 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-[#64748B] font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#102A56]" />
                        <span>Correspondence Address</span>
                      </div>
                      <p className="text-[#17243A]">{operator.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/75 border border-amber-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-[#102A56] mb-1.5">
                      Operator Contact Details Awaiting Owner Confirmation
                    </h2>
                    <p className="text-xs text-[#17243A] leading-relaxed">
                      In accordance with our strict anti-fabrication policy, no placeholder email addresses or simulated server contact forms are displayed before the site owner publishes verified details.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white border border-amber-200 rounded-xl p-3">
                    <dt className="font-semibold text-[#64748B] mb-0.5">
                      Support &amp; Privacy Email
                    </dt>
                    <dd className="font-medium text-amber-900">
                      Pending owner configuration (
                      <code className="text-[11px] bg-amber-100 px-1 rounded">
                        VITE_SUPPORT_EMAIL
                      </code>
                      )
                    </dd>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-xl p-3">
                    <dt className="font-semibold text-[#64748B] mb-0.5">
                      Legal Operator / Entity Name
                    </dt>
                    <dd className="font-medium text-amber-900">
                      {operator.legalName || (
                        <>
                          Pending owner confirmation (
                          <code className="text-[11px] bg-amber-100 px-1 rounded">
                            VITE_OPERATOR_NAME
                          </code>
                          )
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-xl p-3">
                    <dt className="font-semibold text-[#64748B] mb-0.5">
                      Business / Postal Address
                    </dt>
                    <dd className="font-medium text-amber-900">
                      {operator.address || (
                        <>
                          Optional / pending owner input (
                          <code className="text-[11px] bg-amber-100 px-1 rounded">
                            VITE_OPERATOR_ADDRESS
                          </code>
                          )
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-xl p-3">
                    <dt className="font-semibold text-[#64748B] mb-0.5">
                      Commercial Monetization Status
                    </dt>
                    <dd className="font-medium text-[#17243A]">
                      {adsense.isConfigured && monetag.isConfigured
                        ? 'Monetag advertising active; Google AdSense active'
                        : monetag.isConfigured
                          ? 'Monetag advertising active (Google AdSense remains disabled)'
                          : adsense.isConfigured
                            ? 'Google AdSense active (Monetag disabled)'
                            : 'No advertising networks currently active (AdSense disabled until owner approval)'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <form
              onSubmit={handleCopyDiagnostic}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-4"
            >
              <div>
                <h2 className="text-base font-bold text-[#102A56] mb-1">
                  Diagnostic Summary Helper (Local Only)
                </h2>
                <p className="text-xs text-[#64748B]">
                  Format a technical issue summary locally to copy to your clipboard
                  {mailtoHref ? ' or open in your email client' : ''}. Zero form data is sent to any backend server.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reportTopic"
                    className="block text-xs font-semibold text-[#17243A] mb-1.5"
                  >
                    Topic
                  </label>
                  <select
                    id="reportTopic"
                    value={reportData.topic}
                    onChange={(e) => setReportData({ ...reportData, topic: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 min-h-[42px] bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                  >
                    <option value="Bug Report (File Processing Issue)">
                      Bug Report (File Processing Issue)
                    </option>
                    <option value="General Question">General Question</option>
                    <option value="Feature Suggestion">Feature Suggestion</option>
                    <option value="Privacy & Consent Inquiry">Privacy &amp; Consent Inquiry</option>
                    <option value="Copyright / DMCA Inquiry">Copyright / DMCA Inquiry</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reportTool"
                    className="block text-xs font-semibold text-[#17243A] mb-1.5"
                  >
                    PDFQuick Tool
                  </label>
                  <select
                    id="reportTool"
                    value={reportData.tool}
                    onChange={(e) => setReportData({ ...reportData, tool: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 min-h-[42px] bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                  >
                    <option value="Merge PDF">Merge PDF</option>
                    <option value="Split PDF">Split PDF</option>
                    <option value="Compress PDF">Compress PDF</option>
                    <option value="Images to PDF">Images to PDF</option>
                    <option value="PDF to Images">PDF to Images</option>
                    <option value="Rotate PDF">Rotate PDF</option>
                    <option value="Delete PDF Pages">Delete PDF Pages</option>
                    <option value="Reorder PDF Pages">Reorder PDF Pages</option>
                    <option value="Add Page Numbers">Add Page Numbers</option>
                    <option value="Watermark PDF">Watermark PDF</option>
                    <option value="OCR PDF">OCR PDF</option>
                    <option value="Edit PDF Metadata">Edit PDF Metadata</option>
                    <option value="Unlock PDF">Unlock PDF</option>
                    <option value="Financial PDF Form Filler">Financial PDF Form Filler</option>
                    <option value="Financial Document Privacy & Redaction">
                      Financial Privacy &amp; Redaction
                    </option>
                    <option value="General / Website">General / Website</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reportEnv"
                  className="block text-xs font-semibold text-[#17243A] mb-1.5"
                >
                  Browser &amp; Operating System
                </label>
                <input
                  id="reportEnv"
                  type="text"
                  value={reportData.environment}
                  onChange={(e) => setReportData({ ...reportData, environment: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 min-h-[42px] bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                  placeholder="e.g. Chrome 130 on Windows 11, Safari on macOS"
                />
              </div>

              <div>
                <label
                  htmlFor="reportDetails"
                  className="block text-xs font-semibold text-[#17243A] mb-1.5"
                >
                  Issue Description
                </label>
                <textarea
                  id="reportDetails"
                  rows={4}
                  value={reportData.details}
                  onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl text-[#17243A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-none"
                  placeholder="Describe the steps taken and any error message displayed (avoid including confidential file text)..."
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] text-xs sm:text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#102A56] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>
                    {copied ? 'Copied Summary to Clipboard' : 'Copy Summary to Clipboard'}
                  </span>
                </button>
                {mailtoHref && (
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] text-xs sm:text-sm font-semibold text-[#102A56] bg-[#F4F7FB] hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-xl transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#2563EB]" />
                    <span>Open in Email Client</span>
                  </a>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
