import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'money';
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  isLoading = false,
  error = null,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg bg-surface border border-border p-5 shadow-sm flex flex-col justify-between transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {icon && (
          <div
            className={`p-2 rounded-md ${
              tone === 'money'
                ? 'bg-money/15 text-money'
                : 'bg-surface-raised text-primary'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-1.5 py-1" role="status" aria-label={`Loading ${label}`}>
            <Skeleton height={32} width="60%" />
            {hint && <Skeleton height={14} width="40%" />}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-center justify-between text-danger py-1 gap-2"
          >
            <div className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Failed to load</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                aria-label={`Retry loading ${label}`}
                className="text-xs text-text underline hover:text-primary cursor-pointer p-1"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div>
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                tone === 'money' ? 'text-money' : 'text-text'
              }`}
            >
              {value}
            </div>
            {hint && (
              <p className="text-xs text-text-muted mt-1 leading-normal truncate">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

