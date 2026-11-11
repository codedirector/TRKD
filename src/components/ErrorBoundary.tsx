import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  AlertCircle, RefreshCw, Home, ShieldAlert, Copy, Check, 
  ChevronDown, ChevronUp, Terminal, Bug 
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  variant?: 'page' | 'section' | 'card';
  componentContext?: string;
  onReset?: () => void;
  onNavigateHome?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copiedReport: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copiedReport: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[Trackd ErrorBoundary${this.props.componentContext ? ` - ${this.props.componentContext}` : ''}] Caught runtime failure:`, error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      showDetails: false, 
      copiedReport: false 
    });
    this.props.onReset?.();
  };

  private handleCopyReport = async () => {
    const { componentContext, fallbackTitle } = this.props;
    const { error, errorInfo } = this.state;

    const report = [
      '========================================',
      'TRACKD RUNTIME DIAGNOSTIC REPORT',
      '========================================',
      `Timestamp: ${new Date().toISOString()}`,
      `Context: ${componentContext || fallbackTitle || 'Main Layout'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}`,
      `Error Name: ${error?.name || 'Error'}`,
      `Error Message: ${error?.message || 'Unknown runtime error'}`,
      '',
      '--- Error Stack Trace ---',
      error?.stack || 'No stack trace available',
      '',
      '--- Component Stack Trace ---',
      errorInfo?.componentStack || 'No component stack available',
      '========================================'
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = report;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.setState({ copiedReport: true });
      setTimeout(() => this.setState({ copiedReport: false }), 2500);
    } catch (e) {
      console.warn('Failed to copy report to clipboard', e);
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const { 
        variant = 'section', 
        fallbackTitle, 
        fallbackMessage, 
        componentContext, 
        onNavigateHome 
      } = this.props;
      const { error, errorInfo, showDetails, copiedReport } = this.state;

      // 1. PAGE VARIANT: Full page / main view fallback
      if (variant === 'page') {
        return (
          <div className="min-h-[50vh] flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-2xl w-full bg-[#FFF8EE] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000] text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 bg-[#FFDE59] border-2 border-black rounded-full px-3.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000]">
                <ShieldAlert className="w-4 h-4 text-black" />
                <span>FAULT ISOLATED • DATA PROTECTED</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  {fallbackTitle || 'Document View Could Not Be Rendered'}
                </h3>
                <p className="text-sm font-semibold text-neutral-700 mt-2 max-w-lg mx-auto">
                  {fallbackMessage || 'A runtime problem occurred while rendering this document or version. Your uploaded files, permanent links, and tracked data remain safe.'}
                </p>
              </div>

              {/* Error Notice Summary */}
              {error?.message && (
                <div className="bg-white border-2 border-black rounded-xl p-3.5 text-left font-mono text-xs text-neutral-800 shadow-[2px_2px_0px_0px_#000]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-red-600 flex items-center gap-1">
                      <Bug className="w-3.5 h-3.5" />
                      Runtime Exception Caught:
                    </span>
                    {componentContext && (
                      <span className="text-[10px] bg-neutral-100 border border-black/30 px-1.5 py-0.5 rounded text-neutral-600">
                        {componentContext}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-900 font-semibold break-words">
                    {error.message}
                  </p>
                </div>
              )}

              {/* Collapsible Diagnostics Panel */}
              <div className="text-left space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={this.toggleDetails}
                    className="inline-flex items-center gap-1 text-xs font-bold text-neutral-700 hover:text-black cursor-pointer underline underline-offset-2"
                  >
                    <Terminal className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{showDetails ? 'Hide technical diagnostics' : 'View technical diagnostics'}</span>
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    onClick={this.handleCopyReport}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-black rounded-md text-xs font-bold shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                    title="Copy full crash report to clipboard"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-emerald-700">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Diagnostic Report</span>
                      </>
                    )}
                  </button>
                </div>

                {showDetails && (
                  <div className="bg-neutral-900 text-[#70EE9C] border-2 border-black rounded-xl p-3 font-mono text-[11px] max-h-48 overflow-y-auto space-y-2 shadow-[2px_2px_0px_0px_#000]">
                    {error?.stack && (
                      <div>
                        <p className="text-amber-400 font-bold mb-0.5">Stack Trace:</p>
                        <pre className="whitespace-pre-wrap leading-tight text-neutral-300">{error.stack}</pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div className="pt-2 border-t border-neutral-700">
                        <p className="text-amber-400 font-bold mb-0.5">Component Stack:</p>
                        <pre className="whitespace-pre-wrap leading-tight text-neutral-300">{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7A00] hover:bg-[#ff851b] text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload View</span>
                </button>

                {onNavigateHome && (
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    <span>Return to Dashboard</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      // 2. CARD VARIANT: Individual document or version card fallback
      if (variant === 'card') {
        return (
          <div className="bg-[#FFFDF7] border-2 border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_0px_#000] space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-neutral-900 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate max-w-[200px]">{fallbackTitle || 'Unable to display item'}</span>
            </div>
            <p className="text-[11px] text-neutral-600 line-clamp-2">
              {fallbackMessage || 'This item encountered a rendering issue. Other documents remain active.'}
            </p>
            {error?.message && (
              <p className="font-mono text-[10px] text-neutral-500 bg-neutral-100 p-1 rounded border border-neutral-300 truncate">
                {error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-neutral-100 border border-black rounded-md text-[11px] font-bold shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={this.handleCopyReport}
                className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-50 hover:bg-neutral-100 border border-black rounded-md text-[10px] font-bold shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Copy error report"
              >
                {copiedReport ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedReport ? 'Copied' : 'Report'}</span>
              </button>
            </div>
          </div>
        );
      }

      // 3. SECTION VARIANT: Component / section fallback
      return (
        <div className="bg-[#FFF8EE] border-2 border-black rounded-xl p-5 text-center my-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="inline-flex items-center justify-center gap-2 text-neutral-900 font-black text-sm">
            <AlertCircle className="w-4 h-4 text-[#FF7A00] stroke-[2.5]" />
            <span>{fallbackTitle || 'Section Display Interrupted'}</span>
          </div>

          <p className="text-xs font-semibold text-neutral-700 max-w-md mx-auto">
            {fallbackMessage || 'This component encountered an unexpected error while displaying. You can try reloading it safely without refreshing the entire page.'}
          </p>

          {error?.message && (
            <div className="max-w-md mx-auto bg-white border border-black/40 rounded-lg p-2 font-mono text-[11px] text-neutral-800 text-left truncate shadow-[1px_1px_0px_0px_#000]">
              <span className="font-bold text-red-600 mr-1">Error:</span>
              <span>{error.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFDE59] hover:bg-[#fed330] text-black border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Section</span>
            </button>

            <button
              type="button"
              onClick={this.handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Report Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-lg text-xs font-bold shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


