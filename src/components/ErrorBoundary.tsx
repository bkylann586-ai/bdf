import React from 'react';
import { AlertTriangle, RotateCcw, Home, Wrench } from 'lucide-react';
import { navigate } from '../lib/router';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('PDFQuick ErrorBoundary caught a render error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  private handleNavigate = (path: string) => {
    this.setState({ hasError: false, error: null });
    navigate(path);
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const detailMessage =
        this.state.error?.message && this.state.error.message.trim().length > 0
          ? this.state.error.message
          : 'An unexpected browser rendering error occurred while displaying this tool.';

      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-slate-50/60">
          <div
            role="alert"
            className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Something went wrong in this tool
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              The tool encountered an unexpected error while rendering in your browser. Your files remained completely private on your device.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono break-words mb-6 text-left">
              {detailMessage}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => this.handleNavigate('/tools')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Wrench className="w-4 h-4" aria-hidden="true" />
                <span>All Tools</span>
              </button>

              <button
                type="button"
                onClick={() => this.handleNavigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
