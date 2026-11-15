import React from 'react';
import { RefreshCw, AlertCircle, Database } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { ApiError } from '../../lib/errors';

export interface PanelProps {
  id: string;
  title: string;
  serviceName: string;
  updatedAt?: string | Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  error?: Error | ApiError | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const PanelContent: React.FC<PanelProps> = ({
  id,
  title,
  serviceName,
  updatedAt,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data available',
  actions,
  children,
  className = '',
}) => {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const correlationId = (error as ApiError)?.correlationId || (error as any)?.correlation_id;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`rounded-lg bg-surface border border-border shadow-sm flex flex-col ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <h2 id={`${id}-heading`} className="text-base font-semibold text-text">
            {title}
          </h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-raised text-text-muted border border-border">
            {serviceName}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {actions}
          {formattedTime && (
            <span className="text-xs text-text-muted hidden md:inline">
              Updated at {formattedTime}
            </span>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              aria-label={`Refresh ${title}`}
              className="text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
              />
              <span className="hidden sm:inline ml-1">Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-5 flex-1 flex flex-col justify-center min-h-[160px]">
        {isLoading ? (
          <div className="space-y-3 py-2" role="status" aria-label="Loading panel content">
            <Skeleton height={24} width="40%" />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center text-center p-6 gap-3 rounded-md bg-surface-raised/40 border border-danger/30"
          >
            <div className="w-10 h-10 rounded-full bg-danger/15 text-danger flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">
                {error.message || 'Failed to load panel data'}
              </p>
              {correlationId && (
                <p className="font-mono text-xs text-text-muted mt-1 select-all">
                  Reference: {correlationId}
                </p>
              )}
            </div>
            {onRefresh && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefresh}
                className="mt-1"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-text-muted gap-2">
            <Database className="w-8 h-8 opacity-40" />
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export const Panel: React.FC<PanelProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle={`${props.title} Error`} onReset={props.onRefresh}>
      <PanelContent {...props} />
    </ErrorBoundary>
  );
};

