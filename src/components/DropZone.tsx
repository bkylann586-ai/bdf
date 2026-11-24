import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { validateSelectedFiles } from '../lib/fileValidation';

interface DropZoneProps {
  accept: string;
  multiple: boolean;
  onFilesSelected: (files: File[]) => void;
  onSampleRequested?: () => void;
  sampleLabel?: string;
  helperText?: string;
  disabled?: boolean;
  existingTotalBytes?: number;
  delegateValidation?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept,
  multiple,
  onFilesSelected,
  onSampleRequested,
  sampleLabel,
  helperText,
  disabled = false,
  existingTotalBytes = 0,
  delegateValidation = false,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displaySampleLabel = sampleLabel || t('dropzone.sample');
  const displayHelperText = helperText || t('dropzone.helper');
  const acceptedDisplay = accept.replace(/\./g, ' ').toUpperCase();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFiles = (fileList: FileList | null) => {
    setErrorMessage(null);
    if (!fileList || fileList.length === 0) return;

    if (delegateValidation) {
      onFilesSelected(Array.from(fileList));
      return;
    }

    const result = validateSelectedFiles(fileList, {
      accept,
      multiple,
      existingTotalBytes,
    });

    if (result.errorMessage) {
      setErrorMessage(result.errorMessage);
    }

    if (result.validFiles.length > 0) {
      onFilesSelected(result.validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input value so same file can be re-selected if user cleared it
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={`${t('dropzone.clickToSelect')}. ${displayHelperText} Accepted formats: ${acceptedDisplay}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.005]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/60 shadow-sm'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
            {t('dropzone.clickToSelect')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-4">
            {t('dropzone.orDrag')}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-md mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>{acceptedDisplay}</span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 max-w-md">
            {displayHelperText}
          </p>
        </div>
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div role="alert" className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sample file generator link */}
      {onSampleRequested && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSampleRequested();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50/60 px-3 py-1.5 rounded-full border border-blue-200/50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>{displaySampleLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};
