import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { extractNativeFiles, hasNativeFilesInDragEvent } from './dragDropUtils';
import { useTranslation } from './i18n';

type FileDropHandler = (files: File[]) => void;

interface GlobalDropContextType {
  registerDropHandler: (handler: FileDropHandler, toolName?: string, enabled?: boolean) => () => void;
  setPendingDropFiles: (files: File[]) => void;
  clearPendingDropFiles: () => void;
  isDragging: boolean;
}

const GlobalDropContext = createContext<GlobalDropContextType>({
  registerDropHandler: () => () => {},
  setPendingDropFiles: () => {},
  clearPendingDropFiles: () => {},
  isDragging: false,
});

export const useGlobalDrop = () => useContext(GlobalDropContext);

function isTargetInsideLocalDropZone(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).closest !== 'function') {
    return false;
  }
  return Boolean((target as HTMLElement).closest('[data-dropzone="true"]'));
}

export const GlobalDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isOverLocalZone, setIsOverLocalZone] = useState(false);
  const [activeToolName, setActiveToolName] = useState<string>('PDFQuick');
  const handlerRef = useRef<FileDropHandler | null>(null);
  const enabledRef = useRef<boolean>(false);
  const dragCounterRef = useRef(0);
  const pendingDropRef = useRef<{ files: File[]; expiresAt: number } | null>(null);

  const setPendingDropFiles = (files: File[]) => {
    if (!files || files.length === 0) {
      pendingDropRef.current = null;
      return;
    }
    pendingDropRef.current = {
      files: [...files],
      expiresAt: Date.now() + 60_000,
    };
  };

  const clearPendingDropFiles = () => {
    pendingDropRef.current = null;
  };

  const registerDropHandler = (
    handler: FileDropHandler,
    toolName?: string,
    enabled: boolean = true
  ) => {
    handlerRef.current = handler;
    enabledRef.current = enabled;
    if (toolName) setActiveToolName(toolName);
    if (!enabled) {
      dragCounterRef.current = 0;
      setIsDragging(false);
      setIsOverLocalZone(false);
    } else if (pendingDropRef.current) {
      const pending = pendingDropRef.current;
      pendingDropRef.current = null;
      if (Date.now() <= pending.expiresAt && pending.files.length > 0) {
        queueMicrotask(() => {
          handler(pending.files);
        });
      }
    }

    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
        enabledRef.current = false;
        dragCounterRef.current = 0;
        setIsDragging(false);
        setIsOverLocalZone(false);
      }
    };
  };

  useEffect(() => {
    const canAcceptDrop = () => Boolean(handlerRef.current && enabledRef.current);

    const resetDragState = () => {
      dragCounterRef.current = 0;
      setIsDragging(false);
      setIsOverLocalZone(false);
    };

    const handleDragEnter = (e: DragEvent) => {
      if (!canAcceptDrop() || !hasNativeFilesInDragEvent(e.dataTransfer)) return;

      e.preventDefault();
      dragCounterRef.current += 1;
      setIsOverLocalZone(isTargetInsideLocalDropZone(e.target));
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!canAcceptDrop()) {
        resetDragState();
        return;
      }
      e.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
        setIsOverLocalZone(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (!canAcceptDrop() || !hasNativeFilesInDragEvent(e.dataTransfer)) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      const insideLocal = isTargetInsideLocalDropZone(e.target);
      setIsOverLocalZone((prev) => (prev === insideLocal ? prev : insideLocal));
    };

    // Capture phase always resets overlay even when a local DropZone stops propagation
    const handleDropCapture = () => {
      resetDragState();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      resetDragState();

      if (!canAcceptDrop()) return;

      const files = extractNativeFiles(e.dataTransfer);
      if (files.length > 0 && handlerRef.current) {
        handlerRef.current(files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragend', resetDragState);
    window.addEventListener('drop', handleDropCapture, true);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragend', resetDragState);
      window.removeEventListener('drop', handleDropCapture, true);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const showWindowOverlay = isDragging && !isOverLocalZone;

  return (
    <GlobalDropContext.Provider
      value={{
        registerDropHandler,
        setPendingDropFiles,
        clearPendingDropFiles,
        isDragging,
      }}
    >
      {children}

      {/* Global Visual Drop Target Highlight Overlay (steps aside when hovering local DropZone) */}
      {showWindowOverlay && (
        <div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-xs transition-opacity duration-150"
          aria-hidden="true"
        >
          <div className="relative mx-4 max-w-xl w-full p-8 sm:p-12 bg-white/95 rounded-2xl border-2 border-dashed border-[#2563EB] shadow-2xl text-center">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center shadow-lg mb-5">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
                {t('globalDrop.title')}
              </h2>

              <p className="text-sm sm:text-base text-[#64748B] max-w-md mx-auto mb-4">
                {t('globalDrop.subtitle', { tool: activeToolName })}
              </p>

              <p className="text-xs text-[#64748B] font-medium">
                {t('globalDrop.footer')}
              </p>
            </div>
          </div>
        </div>
      )}
    </GlobalDropContext.Provider>
  );
};
