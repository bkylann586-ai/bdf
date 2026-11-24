import React, { useRef } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { ProcessingFile } from '../types';
import { formatBytes } from '../lib/pdfUtils';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalPages = files.reduce((sum, f) => sum + (f.pageCount ?? 1), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="text-xs sm:text-sm font-medium text-slate-700 font-mono tabular-nums">
          <span className="font-sans font-semibold text-slate-900">
            {files.length} {files.length === 1 ? 'PDF' : 'PDFs'} queued
          </span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span>{formatBytes(totalBytes)}</span>
          <span className="mx-1.5 text-slate-300">·</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addLabel}</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-slate-50/70 max-h-60 overflow-y-auto">
        {files.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-6 text-center text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {formatBytes(item.size)} · {item.pageCount ?? 1}{' '}
                  {(item.pageCount ?? 1) === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveFile(item.id)}
              aria-label={`Remove ${item.name}`}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors shrink-0"
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

