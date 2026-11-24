import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FilePenLine,
  AlertCircle,
  RotateCcw,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PdfMetadataValues, ProcessingFile, ProcessingResult } from '../../types';
import { DropZone } from '../DropZone';
import { ProcessingProgress } from '../ProcessingProgress';
import { SuccessDownload } from '../SuccessDownload';
import {
  formatDateTimeLocalInput,
  readPdfMetadata,
  updatePdfMetadata,
} from '../../lib/editPdfMetadata';
import { formatBytes } from '../../lib/pdfUtils';
import { validateSelectedFiles } from '../../lib/fileValidation';
import { createSampleMetadataPdf } from '../../lib/sampleFiles';
import { useTranslation } from '../../lib/i18n';
import { useGlobalDrop } from '../../lib/globalDrop';
import { trackToolStart, trackToolSuccess, trackToolError, trackSampleUse } from '../../lib/analytics';

export const EditPdfMetadataTool: React.FC = () => {
  const { t } = useTranslation();
  const { registerDropHandler } = useGlobalDrop();

  const [file, setFile] = useState<ProcessingFile | null>(null);
  const [originalMetadata, setOriginalMetadata] = useState<PdfMetadataValues | null>(null);

  // Core metadata fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [creationDate, setCreationDate] = useState('');

  // Extended metadata fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');
  const [producer, setProducer] = useState('');
  const [modificationDate, setModificationDate] = useState('');
  const [updateModificationToNow, setUpdateModificationToNow] = useState(true);
  const [stripXmpMetadata, setStripXmpMetadata] = useState(true);
  const [showTitleInWindowBar, setShowTitleInWindowBar] = useState(true);

  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const applyMetadataToForm = (meta: PdfMetadataValues) => {
    setTitle(meta.title);
    setAuthor(meta.author);
    setCreationDate(meta.creationDate);
    setSubject(meta.subject);
    setKeywords(meta.keywords);
    setCreator(meta.creator);
    setProducer(meta.producer);
    setModificationDate(meta.modificationDate);
    setUpdateModificationToNow(true);
    setStripXmpMetadata(true);
    setShowTitleInWindowBar(true);
  };

  const handleFileSelected = async (files: File[]) => {
    if (statusRef.current === 'processing' || statusRef.current === 'success') return;
    if (files.length === 0) return;
    setErrorMessage(null);

    const validation = validateSelectedFiles(files, {
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

    let metadata: PdfMetadataValues;
    try {
      metadata = await readPdfMetadata(selected);
    } catch (e: any) {
      errorParts.push(e?.message || 'Failed to read PDF metadata.');
      setErrorMessage(errorParts.join(' '));
      return;
    }

    if (errorParts.length > 0) {
      setErrorMessage(errorParts.join(' '));
    }

    setStatus('idle');
    setResult(null);
    setOriginalMetadata(metadata);
    applyMetadataToForm(metadata);
    setFile({
      id,
      file: selected,
      name: selected.name,
      size: selected.size,
      type: selected.type,
      pageCount: metadata.pageCount,
    });
  };

  useEffect(() => {
    const canAcceptDrop = status === 'idle' || status === 'error';
    return registerDropHandler(
      (dropped) => {
        handleFileSelected(dropped);
      },
      t('tool.editMetadata.title'),
      canAcceptDrop
    );
  }, [registerDropHandler, t, status]);

  const handleLoadSample = async () => {
    setErrorMessage(null);
    trackSampleUse('edit-pdf-metadata');
    try {
      const sample = await createSampleMetadataPdf();
      await handleFileSelected([sample]);
    } catch (err: any) {
      setErrorMessage(`Could not create sample PDF: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleResetToOriginal = () => {
    if (!originalMetadata) return;
    setErrorMessage(null);
    applyMetadataToForm(originalMetadata);
  };

  const handleClearAllFields = () => {
    setErrorMessage(null);
    setTitle('');
    setAuthor('');
    setCreationDate('');
    setSubject('');
    setKeywords('');
    setCreator('');
    setProducer('');
    setModificationDate('');
  };

  const handleSaveMetadata = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) return;

    setErrorMessage(null);
    setStatus('processing');
    setProgress({ current: 0, total: 3, message: t('progress.processing') });
    trackToolStart('edit-pdf-metadata');
    const startTime = Date.now();

    try {
      const res = await updatePdfMetadata(
        file,
        {
          title,
          author,
          subject,
          keywords,
          creator,
          producer,
          creationDate,
          modificationDate,
          updateModificationToNow,
          stripXmpMetadata,
          showTitleInWindowBar,
        },
        (curr, tot, msg) => {
          setProgress({ current: curr, total: tot, message: msg });
        }
      );

      setResult(res);
      setStatus('success');
      trackToolSuccess('edit-pdf-metadata', {
        durationMs: Date.now() - startTime,
        pageCount: res.pageCount,
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to update PDF metadata.');
      trackToolError('edit-pdf-metadata', err?.name || 'MetadataEditError');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setFile(null);
    setOriginalMetadata(null);
    setErrorMessage(null);
  };

  if (status === 'success' && result) {
    return (
      <SuccessDownload
        result={result}
        onReset={handleReset}
        title={t('tool.editMetadata.successTitle')}
        relatedToolPath="/watermark-pdf"
        relatedToolName="Watermark PDF"
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingProgress
        current={progress.current}
        total={progress.total}
        message={progress.message}
        operationTitle={t('tool.editMetadata.title')}
      />
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      {!file ? (
        <div className="space-y-3">
          <DropZone
            accept="application/pdf,.pdf"
            multiple={false}
            delegateValidation={true}
            onFilesSelected={handleFileSelected}
            onSampleRequested={handleLoadSample}
            sampleLabel="Load a sample PDF with existing metadata"
            helperText="Select 1 PDF file (up to 250 MB) to inspect and edit Title, Author, Creation Date, and document properties."
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
        <form onSubmit={handleSaveMetadata} className="space-y-6">
          {/* File Overview Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {formatBytes(file.size)} · {file.pageCount}{' '}
                  {file.pageCount === 1 ? 'page' : 'pages'}
                  {originalMetadata?.hasXmpStream ? ' · XMP metadata stream detected' : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-900 underline shrink-0 whitespace-nowrap"
            >
              Choose different file
            </button>
          </div>

          {/* Primary Metadata Fields: Title, Author, Creation Date */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Core Document Properties</h3>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Original</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllFields}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="metaTitleInput" className="text-xs font-semibold text-slate-700">
                    Document Title
                  </label>
                  {title && (
                    <button
                      type="button"
                      onClick={() => setTitle('')}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  id="metaTitleInput"
                  type="text"
                  maxLength={250}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Financial Report 2026"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="metaAuthorInput" className="text-xs font-semibold text-slate-700">
                    Author
                  </label>
                  {author && (
                    <button
                      type="button"
                      onClick={() => setAuthor('')}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  id="metaAuthorInput"
                  type="text"
                  maxLength={200}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Alex Morgan or Finance Department"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="metaCreationDateInput"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Creation Date &amp; Time</span>
                </label>
                <div className="flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCreationDate(formatDateTimeLocalInput(new Date()))}
                    className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    Set to Now
                  </button>
                  {creationDate && (
                    <button
                      type="button"
                      onClick={() => setCreationDate('')}
                      className="text-slate-500 hover:text-slate-800 whitespace-nowrap"
                    >
                      Clear Date
                    </button>
                  )}
                </div>
              </div>
              <input
                id="metaCreationDateInput"
                type="datetime-local"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
                className="w-full sm:w-80 text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tabular-nums"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave blank to remove the CreationDate entry from the PDF Info dictionary.
              </p>
            </div>
          </div>

          {/* Extended Metadata Toggle */}
          <div className="border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              aria-expanded={showAdvanced}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors rounded-lg"
            >
              <span>
                Additional PDF Properties (Subject, Keywords, Creator, Producer, Modification Date)
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 pt-3 border-t border-slate-200 space-y-4 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="metaSubjectInput"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Subject
                    </label>
                    <input
                      id="metaSubjectInput"
                      type="text"
                      maxLength={250}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief document summary or topic"
                      className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="metaKeywordsInput"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Keywords (comma-separated)
                    </label>
                    <input
                      id="metaKeywordsInput"
                      type="text"
                      maxLength={250}
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g. invoice, 2026, tax, summary"
                      className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="metaCreatorInput"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Creator Application
                    </label>
                    <input
                      id="metaCreatorInput"
                      type="text"
                      maxLength={200}
                      value={creator}
                      onChange={(e) => setCreator(e.target.value)}
                      placeholder="e.g. Microsoft Word, Google Docs"
                      className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="metaProducerInput"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      PDF Producer
                    </label>
                    <input
                      id="metaProducerInput"
                      type="text"
                      maxLength={200}
                      value={producer}
                      onChange={(e) => setProducer(e.target.value)}
                      placeholder="e.g. PDFQuick"
                      className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateModificationToNow}
                      onChange={(e) => setUpdateModificationToNow(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">
                      Set Modification Date (ModDate) to current time when saving
                    </span>
                  </label>

                  {!updateModificationToNow && (
                    <div>
                      <label
                        htmlFor="metaModDateInput"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Custom Modification Date &amp; Time
                      </label>
                      <input
                        id="metaModDateInput"
                        type="datetime-local"
                        value={modificationDate}
                        onChange={(e) => setModificationDate(e.target.value)}
                        className="w-full sm:w-80 text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tabular-nums"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Compatibility & Viewer Options */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showTitleInWindowBar}
                onChange={(e) => setShowTitleInWindowBar(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="font-semibold text-slate-800">
                  Display document title in browser &amp; PDF viewer title bar
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Sets ViewerPreferences DisplayDocTitle when a Document Title is provided.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={stripXmpMetadata}
                onChange={(e) => setStripXmpMetadata(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="font-semibold text-slate-800">
                  Remove embedded XMP XML metadata stream (recommended)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Ensures desktop PDF readers display your updated Info Title, Author, and Creation Date instead of stale cached XMP fields.
                </span>
              </span>
            </label>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <FilePenLine className="w-4 h-4" />
              <span>{t('tool.editMetadata.button')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
