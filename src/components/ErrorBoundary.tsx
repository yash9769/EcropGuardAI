import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Warning } from './Icons';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col h-screen w-full items-center justify-center bg-[#f0f4f0] p-6 font-sans">
          <div className="bg-white border border-red-100 p-8 rounded-[2rem] max-w-lg w-full flex flex-col items-center text-center shadow-xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Warning className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Oops! UI Glitch</h1>
            <p className="text-gray-500 mb-6 font-medium leading-relaxed">Don't worry, the crops are fine but our app hit a snag. Please reload to restore the interface.</p>
            <div className="bg-gray-50 p-4 rounded-xl w-full overflow-x-auto border border-gray-100 text-left mb-8 shadow-inner">
              <code className="text-xs font-mono text-red-700/80 whitespace-pre-wrap break-words">{this.state.error?.toString() || 'Unknown Error'}</code>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black tracking-widest uppercase text-xs hover:bg-emerald-800 transition-all shadow-lg active:scale-95"
            >
              Reload Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
