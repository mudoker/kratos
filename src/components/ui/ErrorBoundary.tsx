import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-red-500/20 rounded-full text-red-500">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Component Failure</h2>
            <p className="text-sm text-red-400 mt-1">The Agentic OS encountered a runtime exception in this module.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
          >
            <RefreshCcw size={16} />
            <span>Reboot Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
