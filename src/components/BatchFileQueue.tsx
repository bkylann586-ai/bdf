import React, { useRef } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { ProcessingFile } from '../types';
import { formatBytes } from '../lib/fileHelpers';
import { useTranslation } from '../lib/i18n';
import { InlineDropTarget } from './InlineDropTarget';

interface BatchFileQueueProps {
  files: ProcessingFile[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  addLabel?: string;
}

export const BatchFileQueue: React.FC<BatchFileQueueProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onClearAll,
  addLabel = 'Add more PDFs',
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalPages = files.reduce((sum, f) => sum + (f.pageCount ?? 1), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
        <div className="text-xs sm:text-sm font-medium text-[#64748B] font-mono tabular-nums">
          <span className="font-sans font-bold text-[#0F172A]">
            {files.length} {files.length === 1 ? 'PDF' : 'PDFs'} queued
          </span>
          <span className="mx-1.5 text-[#CBD5E1]">·</span>
          <span>{formatBytes(totalBytes)}</span>
          <span className="mx-1.5 text-[#CBD5E1]">·</span>
          <span>
            {totalPages} {totalPages === 1 ? 'page' : 'pages'} total
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddFiles(Array.from(e.target.files));
              }
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 min-h-[36px] text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:text-[#2563EB] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{addLabel}</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="px-3 min-h-[36px] text-xs font-medium text-[#64748B] hover:text-red-700 bg-white hover:bg-red-50 border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('batchQueue.clear')}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] max-h-60 overflow-y-auto">
        {files.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-6 text-center text-[11px] font-mono tabular-nums text-[#64748B] shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-[#17243A] truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-[#64748B] font-mono tabular-nums">
                  {formatBytes(item.size)} · {item.pageCount ?? 1}{' '}
                  {(item.pageCount ?? 1) === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(item.id)}
              aria-label={`Remove ${item.name}`}
              className="p-2 text-[#64748B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <InlineDropTarget
        accept="application/pdf,.pdf"
        multiple={true}
        label="Drag and drop more PDFs here or click to append"
        dragActiveLabel="Release to append PDFs to batch queue"
        onFilesSelected={onAddFiles}
      />
    </div>
  );
};
