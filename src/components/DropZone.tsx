import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, ArrowDownToLine, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { validateSelectedFiles } from '../lib/fileValidation';
import { extractNativeFiles, hasNativeFilesInDragEvent } from '../lib/dragDropUtils';

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
  const dragCounterRef = useRef(0);

  const displaySampleLabel = sampleLabel || t('dropzone.sample');
  const displayHelperText = helperText || t('dropzone.helper');
  const acceptedDisplay = accept
    .split(',')
    .filter((token) => token.startsWith('.'))
    .map((token) => token.replace('.', '').toUpperCase())
    .join(', ') || accept.replace(/\./g, ' ').toUpperCase();

  useEffect(() => {
    const resetDragState = () => {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    };

    window.addEventListener('dragend', resetDragState);
    window.addEventListener('drop', resetDragState);
    return () => {
      window.removeEventListener('dragend', resetDragState);
      window.removeEventListener('drop', resetDragState);
    };
  }, []);

  const processFiles = async (incomingFiles: File[]) => {
    setErrorMessage(null);
    if (!incomingFiles || incomingFiles.length === 0) return;

    if (delegateValidation) {
      onFilesSelected(incomingFiles);
      return;
    }

    const result = await validateSelectedFiles(incomingFiles, {
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || !hasNativeFilesInDragEvent(e.dataTransfer)) return;
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) {
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
      return;
    }
    if (!hasNativeFilesInDragEvent(e.dataTransfer)) return;
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    const leftContainer =
      !e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node);
    if (dragCounterRef.current === 0 || leftContainer) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = extractNativeFiles(e.dataTransfer);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
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
        data-dropzone="true"
        data-drag-over={isDragOver ? 'true' : 'false'}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        className={`group relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/90 ring-4 ring-blue-500/15 shadow-md scale-[1.005]'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/70 shadow-sm'
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

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto pointer-events-none">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-150 ${
              isDragOver
                ? 'bg-blue-600 text-white shadow-sm scale-110'
                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-105'
            }`}
          >
            {isDragOver ? (
              <ArrowDownToLine className="w-7 h-7" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <h3
            className={`text-base sm:text-lg font-semibold mb-1 transition-colors ${
              isDragOver ? 'text-blue-800' : 'text-slate-900'
            }`}
          >
            {isDragOver ? t('dropzone.dragActive') : t('dropzone.clickToSelect')}
          </h3>

          <p
            className={`text-xs sm:text-sm mb-4 transition-colors ${
              isDragOver ? 'text-blue-700 font-medium' : 'text-slate-500'
            }`}
          >
            {isDragOver
              ? multiple
                ? 'Release to add native files to your local queue'
                : 'Release to open file directly in browser memory'
              : t('dropzone.orDrag')}
          </p>

          <div
            className={`flex items-center gap-2 text-xs font-mono tabular-nums mb-2 transition-colors ${
              isDragOver ? 'text-blue-700 font-semibold' : 'text-slate-500'
            }`}
          >
            <span>{acceptedDisplay}</span>
            <span aria-hidden="true">·</span>
            <span>{multiple ? 'Single or batch' : 'Single file'}</span>
            <span aria-hidden="true">·</span>
            <span>Up to 250 MB</span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 max-w-md leading-relaxed">
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
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50/60 px-3.5 py-2 rounded-lg border border-blue-200/60 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>{displaySampleLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};

