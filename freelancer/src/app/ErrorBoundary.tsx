import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-sm">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-danger-bg border border-danger-border text-danger mb-3">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">
            {this.props.fallbackTitle || "Panel Encountered an Error"}
          </h3>
          <p className="text-xs text-muted mb-4 max-w-sm mx-auto">
            {this.state.error?.message || "An unexpected error occurred while rendering this section."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Try again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

