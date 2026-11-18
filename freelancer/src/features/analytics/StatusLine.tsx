import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { GrafanaConnectionStatus } from './probe';

export type StatusLineState = 'checking' | GrafanaConnectionStatus | 'not-configured' | 'mixed-content';

interface StatusLineProps {
  status: StatusLineState;
  host: string | null;
  lastChecked: Date | null;
}

export const StatusLine: React.FC<StatusLineProps> = ({
  status,
  host,
  lastChecked,
}) => {
  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  const getAnnouncementText = () => {
    if (status === 'checking') return 'Checking Grafana connection…';
    if (status === 'reachable') return `Connected to Grafana at ${host || 'backend'}.`;
    if (status === 'unreachable') return `Grafana is unreachable at ${host || 'backend'}.`;
    if (status === 'mixed-content') return 'Embedding blocked due to mixed content.';
    return 'Grafana is not configured.';
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <span className="sr-only" role="status" aria-live="polite">
        {getAnnouncementText()}
      </span>

      {status === 'checking' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-line bg-surface text-muted font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" aria-hidden="true" />
          <span>Checking…</span>
        </span>
      )}

      {status === 'reachable' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-success-border bg-success-bg text-success font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          <span>Connected</span>
        </span>
      )}

      {(status === 'unreachable' || status === 'mixed-content' || status === 'not-configured') && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-danger-border bg-danger-bg text-danger font-medium">
          <XCircle className="w-3.5 h-3.5 text-danger" aria-hidden="true" />
          <span>Unreachable</span>
        </span>
      )}

      {host && (
        <span className="text-muted">
          Grafana at <span className="font-mono text-ink">{host}</span>
        </span>
      )}

      {lastChecked && (
        <span className="text-muted">
          Last checked {formatTime(lastChecked)}
        </span>
      )}
    </div>
  );
};
