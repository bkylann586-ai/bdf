import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Unlock,
  Lock,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { ProcessingFile, ProcessingResult, UnlockPdfInspection } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import { Link } from '../Link';
import { inspectPdfEncryption, unlockPdfDocument } from '../../lib/unlockPdf';
import { formatBytes } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import {
  createSampleEncryptedPdf,
  SAMPLE_ENCRYPTED_PDF_PASSWORD,
} from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import {
  trackToolStart,
  trackToolSuccess,
  trackToolError,
  trackSampleUse,
} from '../../lib/analytics';

export const UnlockPdfTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();

  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [inspection, setInspection] = useState<UnlockPdfInspection | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSampleFile, setIsSampleFile] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 100, message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusRef = useRef(status);
  const isInspectingRef = useRef(isInspecting);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isInspectingRef.current = isInspecting;
  }, [isInspecting]);

  const handleFileSelected = async (files: File[], fromSample: boolean = false) => {
    if (
      isInspectingRef.current ||
      statusRef.current === 'processing' ||
      statusRef.current === 'success'
    ) {
      return;
    }
    if (files.length === 0) return;

    setErrorMessage(null);

    const validation = await validateSelectedFiles(files, {
      accept: 'application/pdf,.pdf',
      multiple: false,
    });

    const errorParts: string[] = [];
    if (validation.errorMessage) {
      errorParts.push(validation.errorMessage);
    }
    if (validation.validFiles.length === 0) {
      if (errorParts.length > 0) setErrorMessage(errorParts.join(' '));
      return;
    }

    const selected = validation.validFiles[0];
    const id = `${selected.name}-${Date.now()}`;

    setIsInspecting(true);
    try {
      const inspected = await inspectPdfEncryption(selected);

      if (errorParts.length > 0) {
        setErrorMessage(errorParts.join(' '));
      }

      setStatus('idle');
      setResult(null);
      setPassword('');
      setShowPassword(false);
      setIsSampleFile(fromSample);
      setInspection(inspected);
      setFile({
        id,
        file: selected,
        name: selected.name,
        size: selected.size,
        type: selected.type,
        pageCount: inspected.pageCount,
      });

      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 60);
    } catch (err: any) {
      errorParts.push(err?.message || 'Failed to inspect PDF file.');
      setErrorMessage(errorParts.join(' '));
    } finally {
      setIsInspecting(false);
    }
  };

  useEffect(() => {
    const canAcceptDrop = !isInspecting && (status === 'idle' || status === 'error');
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped, false);
      },
      t('tool.unlockPdf.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status, isInspecting]);

  const handleLoadSample = async () => {
    if (isInspectingRef.current) return;
    setErrorMessage(null);
    setIsInspecting(true);
    trackSampleUse('unlock-pdf');
    try {
      const sample = await createSampleEncryptedPdf();
      isInspectingRef.current = false;
      setIsInspecting(false);
      await handleFileSelected([sample], true);
    } catch (err: any) {
      setIsInspecting(false);
      setErrorMessage(`Could not create encrypted sample PDF: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file || !inspection) return;
    if (inspection.status === 'unencrypted') return;

    if (inspection.requiresPassword && password.length === 0) {
      setErrorMessage('Please enter the PDF password to unlock this document.');
      passwordInputRef.current?.focus();
      return;
    }

    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 5, total: 100, message: t('progress.processing') });
    trackToolStart('unlock-pdf');
    const startTime = Date.now();

    try {
      const res = await unlockPdfDocument(file, password, (curr, tot, msg) => {
        setProgress({ current: curr, total: tot, message: msg });
      });

      // Clear password from React state after decryption finishes
      setPassword('');
      setShowPassword(false);
      setResult(res);
      setStatus('success');
      trackToolSuccess('unlock-pdf', {
        durationMs: Date.now() - startTime,
        pageCount: res.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to unlock PDF.');
      trackToolError('unlock-pdf', err?.name || 'UnlockPdfError');
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setFile(null);
    setInspection(null);
    setIsSampleFile(false);
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={t('tool.unlockPdf.successTitle')}
        relatedToolPath="/edit-pdf-metadata"
        relatedToolName="Edit PDF Metadata"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.unlockPdf.title')}
      />
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      {isInspecting && !file ? (
        <div
          role="status"
          aria-live="polite"
          className="py-12 flex flex-col items-center justify-center text-center space-y-3"
        >
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-900">
            Inspecting PDF encryption locally...
          </p>
          <p className="text-xs text-slate-500">
            Loading WebAssembly decryption module in browser memory (zero uploads).
          </p>
        </div>
      ) : !file ? (
        <div className="space-y-3">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={false}
            delegateValidation={true}
            onFilesSelected={(selected) => handleFileSelected(selected, false)}
            onSampleRequested={handleLoadSample}
            sampleLabel="Try with a sample AES-256 encrypted PDF"
            helperText="Select or drop 1 encrypted PDF file (up to 250 MB) to remove password or permission locks inside your browser."
          />
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleUnlock} className="space-y-6">
          {/* File Overview Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                  <span>{formatBytes(file.size)}</span>
                  {typeof file.pageCount === 'number' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </>
                  )}
                  {inspection?.pdfVersion && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>PDF {inspection.pdfVersion}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {inspection?.status === 'password-required' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Password Required</span>
                </span>
              )}
              {inspection?.status === 'owner-locked' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                  <KeyRound className="w-3 h-3" />
                  <span>Owner Restrictions</span>
                </span>
              )}
              {inspection?.status === 'unencrypted' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Already Unlocked</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-600 hover:text-slate-900 underline whitespace-nowrap cursor-pointer"
              >
                Choose different file
              </button>
            </div>
          </div>

          {/* Client-Side Privacy Notice */}
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>100% Browser-Only Decryption:</strong> Both your PDF and password remain strictly inside local WebAssembly memory on your device and are never transmitted over the network.
            </p>
          </div>

          {/* Unencrypted File Feedback */}
          {inspection?.status === 'unencrypted' ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    This PDF is not password-protected
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    No open password or owner permission restrictions were detected on this document. You can process it immediately with any PDFQuick tool:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-7">
                <Link
                  to="/merge-pdf"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-md transition-colors"
                >
                  Merge PDF
                </Link>
                <Link
                  to="/compress-pdf"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-md transition-colors"
                >
                  Compress PDF
                </Link>
                <Link
                  to="/edit-pdf-metadata"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-md transition-colors"
                >
                  Edit PDF Metadata
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {inspection?.status === 'owner-locked' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 leading-relaxed">
                  <strong>Permission Restrictions Detected:</strong> This PDF opens without a user password, but has owner restrictions (such as disabled printing, copying, or editing). Click <strong>{t('tool.unlockPdf.button')}</strong> directly to strip those restrictions, or enter an owner password if prompted.
                </div>
              )}

              {isSampleFile && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
                  <div>
                    <span className="font-semibold">Sample Encrypted PDF Password:</span>{' '}
                    <code className="px-1.5 py-0.5 bg-white border border-amber-200 rounded font-mono font-bold text-amber-950">
                      {SAMPLE_ENCRYPTED_PDF_PASSWORD}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(SAMPLE_ENCRYPTED_PDF_PASSWORD);
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Fill demo password
                  </button>
                </div>
              )}

              <div>
                <label
                  htmlFor="unlockPdfPasswordInput"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  {inspection?.requiresPassword
                    ? 'Enter PDF Password (Required)'
                    : 'Owner Password (Optional)'}
                </label>

                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    id="unlockPdfPasswordInput"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={
                      inspection?.requiresPassword
                        ? 'Enter the open or owner password...'
                        : 'Optional — leave blank to remove owner restrictions'
                    }
                    className="w-full text-sm pl-3.5 pr-11 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Supports RC4 (40/128-bit), AES-128, and AES-256 encrypted PDFs with either the document open password or owner password.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {inspection?.status !== 'unencrypted' && (
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>{t('tool.unlockPdf.button')}</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
