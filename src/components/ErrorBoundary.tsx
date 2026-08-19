import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-4">
              The app encountered an unexpected error. You can try refreshing or resetting local data.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-100 p-3 rounded-lg text-left text-[11px] font-mono text-slate-700 overflow-x-auto mb-6 max-h-28">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
              >
                <RefreshCw size={14} />
                Refresh Page
              </button>
              <button
                onClick={this.handleResetStorage}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-200 transition"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
