import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[eCropGuard Error Boundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-surface gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-4xl">
            🌿
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-black text-red-700 mb-2">Something went wrong</h2>
            <p className="text-sm text-on-surface-variant mb-1">
              eCropGuard ran into a problem. Your data is safe.
            </p>
            <p className="text-xs text-on-surface-variant/60 font-mono bg-surface-container rounded-lg p-2 mt-2 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-8 py-3 signature-gradient text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-on-surface-variant underline"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
