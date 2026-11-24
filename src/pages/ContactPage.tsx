import React, { useState } from 'react';
import { MessageSquare, CheckCircle2, Info, Bug, Copy, Clock } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SeoMeta } from '../components/SeoMeta';

export const ContactPage: React.FC = () => {
  const [reportData, setReportData] = useState({
    topic: 'Bug Report (File Processing Issue)',
    tool: 'Merge PDF',
    environment: '',
    details: '',
  });
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = [
      `Topic: ${reportData.topic}`,
      `Tool: ${reportData.tool}`,
      `Browser / OS: ${reportData.environment || 'Not specified'}`,
      '',
      'Details:',
      reportData.details.trim() || 'No details entered.',
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="flex-1 bg-white pb-16">
      <SeoMeta
        title="Contact & Support Information | PDFQuick"
        description="Support guidance, technical bug reporting instructions, and operator contact status for PDFQuick client-side PDF utilities."
        path="/contact"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Contact & Support' }]} />

        <div className="py-8 sm:py-10 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Contact & Support
          </h1>
          <p className="text-sm text-slate-600">
            Support guidance and technical troubleshooting information for PDFQuick&apos;s browser-based PDF utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          {/* Info sidebar */}
          <div className="space-y-6 text-sm text-slate-600">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Client-Side Architecture</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PDFQuick runs entirely inside your browser without storing user accounts or document databases on a backend server.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-amber-600" />
                <span>Reporting File Issues</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When documenting an issue with a PDF file, note your browser (Chrome, Firefox, Safari, Edge), operating system, and exact error message. Never share confidential documents.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-600" />
                <span>Privacy Reminder</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                All document processing happens in your device&apos;s RAM. No third party can access or inspect files you open in PDFQuick.
              </p>
            </div>
          </div>

          {/* Deferred Contact Status + Local Diagnostic Formatter */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-1.5">
                    Direct Contact Channel Pending Owner Configuration
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed mb-2">
                    A public support email address and legal operator identity have not been published yet. In accordance with our transparency policy, no placeholder email addresses or simulated submission forms are used on this page.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Once the website owner adds their verified support email address and legal contact details prior to public release, direct inquiries can be sent there.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleCopyDiagnostic}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Diagnostic Summary Helper (Local Only)
                </h3>
                <p className="text-xs text-slate-500">
                  Use this helper to format a technical issue description and copy it to your clipboard. Nothing is transmitted over the network.
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
                    <option value="Privacy Inquiry">Privacy Inquiry</option>
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

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Summary to Clipboard' : 'Copy Summary to Clipboard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
