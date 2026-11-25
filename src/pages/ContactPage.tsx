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

  const { operator, adsense } = getSiteConfig();
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
    <div className="flex-1 bg-white pb-16">
      <SeoMeta
        title="Contact & Support Information | PDFQuick"
        description="Support guidance, technical bug reporting instructions, and operator contact details for PDFQuick client-side PDF utilities."
        path="/contact"
        schema={schema}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Contact & Support' }]} />

        <div className="py-8 sm:py-10 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Contact &amp; Support
          </h1>
          <p className="text-sm text-slate-600">
            Support guidance, technical troubleshooting information, and verified operator disclosures for PDFQuick&apos;s browser-based PDF utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          {/* Info sidebar */}
          <div className="space-y-6 text-sm text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h2 className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Client-Side Architecture</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                PDFQuick runs entirely inside your browser without storing user accounts or document databases on a backend server.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-amber-600" />
                <span>Reporting File Issues</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When documenting an issue with a PDF file, note your browser (Chrome, Firefox, Safari, Edge), operating system, and exact error message. Never share confidential documents.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-600" />
                <span>Privacy Reminder</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All document processing happens in your device&apos;s RAM. No third party can access or inspect files you open in PDFQuick.
              </p>
            </div>
          </div>

          {/* Operator Contact Disclosure + Local Diagnostic Formatter */}
          <div className="md:col-span-2 space-y-6">
            {operator.supportEmail ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900">
                      Direct Operator Support &amp; Legal Inquiries
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Reach the PDFQuick operator directly using the verified contact channel below. Please avoid attaching sensitive PDFs or banking statements to support emails.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white border border-emerald-200 rounded-lg p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Support Email</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`mailto:${operator.supportEmail}`}
                        className="font-semibold text-blue-700 hover:underline break-all"
                      >
                        {operator.supportEmail}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer shrink-0"
                      >
                        {emailCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {operator.legalName && (
                    <div className="bg-white border border-emerald-200 rounded-lg p-3.5">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Operator / Publisher</span>
                      </div>
                      <p className="font-semibold text-slate-900">{operator.legalName}</p>
                    </div>
                  )}

                  {operator.address && (
                    <div className="bg-white border border-emerald-200 rounded-lg p-3.5 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>Correspondence Address</span>
                      </div>
                      <p className="text-slate-700">{operator.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1.5">
                      Operator Contact Details Awaiting Owner Confirmation
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      In accordance with our strict anti-fabrication policy, no placeholder email addresses or simulated server contact forms are displayed before the site owner publishes verified details.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/90 border border-amber-200 rounded-lg p-3">
                    <dt className="font-semibold text-slate-500 mb-0.5">Support &amp; Privacy Email</dt>
                    <dd className="font-medium text-amber-900">
                      Pending owner configuration (<code className="text-[11px] bg-amber-100 px-1 rounded">VITE_SUPPORT_EMAIL</code>)
                    </dd>
                  </div>
                  <div className="bg-white/90 border border-amber-200 rounded-lg p-3">
                    <dt className="font-semibold text-slate-500 mb-0.5">Legal Operator / Entity Name</dt>
                    <dd className="font-medium text-amber-900">
                      {operator.legalName || (
                        <>
                          Pending owner confirmation (<code className="text-[11px] bg-amber-100 px-1 rounded">VITE_OPERATOR_NAME</code>)
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="bg-white/90 border border-amber-200 rounded-lg p-3">
                    <dt className="font-semibold text-slate-500 mb-0.5">Business / Postal Address</dt>
                    <dd className="font-medium text-amber-900">
                      {operator.address || (
                        <>
                          Optional / pending owner input (<code className="text-[11px] bg-amber-100 px-1 rounded">VITE_OPERATOR_ADDRESS</code>)
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="bg-white/90 border border-amber-200 rounded-lg p-3">
                    <dt className="font-semibold text-slate-500 mb-0.5">Commercial Monetization Status</dt>
                    <dd className="font-medium text-slate-700">
                      {adsense.isConfigured
                        ? 'Google AdSense active with CMP consent controls'
                        : 'Ad-free pre-monetization mode (AdSense disabled until owner approval)'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <form
              onSubmit={handleCopyDiagnostic}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4"
            >
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  Diagnostic Summary Helper (Local Only)
                </h2>
                <p className="text-xs text-slate-500">
                  Format a technical issue summary locally to copy to your clipboard{mailtoHref ? ' or open in your email client' : ''}. Zero form data is sent to any backend server.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reportTopic" className="block text-xs font-semibold text-slate-700 mb-1">
                    Topic
                  </label>
                  <select
                    id="reportTopic"
                    value={reportData.topic}
                    onChange={(e) => setReportData({ ...reportData, topic: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Bug Report (File Processing Issue)">Bug Report (File Processing Issue)</option>
                    <option value="General Question">General Question</option>
                    <option value="Feature Suggestion">Feature Suggestion</option>
                    <option value="Privacy & Consent Inquiry">Privacy &amp; Consent Inquiry</option>
                    <option value="Copyright / DMCA Inquiry">Copyright / DMCA Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="reportTool" className="block text-xs font-semibold text-slate-700 mb-1">
                    PDFQuick Tool
                  </label>
                  <select
                    id="reportTool"
                    value={reportData.tool}
                    onChange={(e) => setReportData({ ...reportData, tool: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    <option value="Financial Document Privacy & Redaction">Financial Privacy &amp; Redaction</option>
                    <option value="General / Website">General / Website</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reportEnv" className="block text-xs font-semibold text-slate-700 mb-1">
                  Browser &amp; Operating System
                </label>
                <input
                  id="reportEnv"
                  type="text"
                  value={reportData.environment}
                  onChange={(e) => setReportData({ ...reportData, environment: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Chrome 130 on Windows 11, Safari on macOS"
                />
              </div>

              <div>
                <label htmlFor="reportDetails" className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Description
                </label>
                <textarea
                  id="reportDetails"
                  rows={4}
                  value={reportData.details}
                  onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe the steps taken and any error message displayed (avoid including confidential file text)..."
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Summary to Clipboard' : 'Copy Summary to Clipboard'}</span>
                </button>
                {mailtoHref && (
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
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
