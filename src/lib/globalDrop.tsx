import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Sparkles } from 'lucide-react';
import { useTranslation } from './i18n';

type FileDropHandler = (files: File[]) => void;

interface GlobalDropContextType {
  registerDropHandler: (handler: FileDropHandler, toolName?: string, enabled?: boolean) => () => void;
  isDragging: boolean;
}

const GlobalDropContext = createContext<GlobalDropContextType>({
  registerDropHandler: () => () => {},
  isDragging: false,
});

export const useGlobalDrop = () => useContext(GlobalDropContext);

export const GlobalDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeToolName, setActiveToolName] = useState<string>('PDFQuick');
  const handlerRef = useRef<FileDropHandler | null>(null);
  const enabledRef = useRef<boolean>(false);
  const dragCounterRef = useRef(0);
  const { t } = useTranslation();

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
    }

    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
        enabledRef.current = false;
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };
  };

  useEffect(() => {
    const canAcceptDrop = () => Boolean(handlerRef.current && enabledRef.current);

    const resetDragState = () => {
      dragCounterRef.current = 0;
      setIsDragging(false);
    };

    const handleDragEnter = (e: DragEvent) => {
      // Only react to file drags from the OS when an active tool accepts drops
      if (!canAcceptDrop() || !e.dataTransfer || !e.dataTransfer.types.includes('Files')) return;

      e.preventDefault();
      dragCounterRef.current += 1;
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
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (!canAcceptDrop() || !e.dataTransfer || !e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    // Capture phase always resets overlay even when DropZone stops propagation
    const handleDropCapture = () => {
      resetDragState();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      resetDragState();

      if (!canAcceptDrop()) return;

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        if (handlerRef.current) {
          handlerRef.current(files);
        }
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

  return (
    <GlobalDropContext.Provider value={{ registerDropHandler, isDragging }}>
      {children}

      {/* Global Visual Drop Target Highlight Overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-blue-900/40 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          aria-hidden="true"
        >
          <div className="relative mx-4 max-w-xl w-full p-8 sm:p-12 bg-white/95 rounded-2xl border-4 border-dashed border-blue-500 shadow-2xl text-center transform scale-100 transition-transform">
            {/* Ambient Pulse Ring */}
            <div className="absolute inset-0 rounded-2xl bg-blue-500/10 animate-pulse pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg mb-5 animate-bounce">
                <UploadCloud className="w-10 h-10" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Drop your files anywhere!
              </h2>

              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-4">
                Release anywhere in your browser window to immediately load files into{' '}
                <strong className="text-blue-600 font-semibold">{activeToolName}</strong>.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>100% Client-Side In-Browser Memory Processing</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </GlobalDropContext.Provider>
  );
};
