import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, UploadCloud } from 'lucide-react';
import { extractNativeFiles, hasNativeFilesInDragEvent } from '../lib/dragDropUtils';

interface InlineDropTargetProps {
  accept: string;
  multiple?: boolean;
  label: string;
  dragActiveLabel?: string;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Compact secondary drag-and-drop bar for appending additional native files
 * once a tool already has queued items visible.
 */
export const InlineDropTarget: React.FC<InlineDropTargetProps> = ({
  accept,
  multiple = true,
  label,
  dragActiveLabel = 'Drop files here to add to queue',
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const reset = () => {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    };
    window.addEventListener('dragend', reset);
    window.addEventListener('drop', reset);
    return () => {
      window.removeEventListener('dragend', reset);
      window.removeEventListener('drop', reset);
    };
  }, []);

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

    const dropped = extractNativeFiles(e.dataTransfer);
    if (dropped.length > 0) {
      onFilesSelected(dropped);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={label}
      data-dropzone="true"
      data-drag-over={isDragOver ? 'true' : 'false'}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`w-full min-h-[44px] px-4 py-2.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
        isDragOver
          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#102A56] ring-2 ring-[#38BDF8]/30'
          : 'border-[#CBD5E1] bg-[#F4F7FB] hover:border-[#2563EB] hover:bg-[#EFF6FF]/60 text-[#64748B] hover:text-[#102A56]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />
      <span className="pointer-events-none inline-flex items-center gap-2">
        {isDragOver ? (
          <ArrowDownToLine className="w-4 h-4 text-[#2563EB] shrink-0" />
        ) : (
          <UploadCloud className="w-4 h-4 text-[#2563EB] shrink-0" />
        )}
        <span>{isDragOver ? dragActiveLabel : label}</span>
      </span>
    </div>
  );
};
