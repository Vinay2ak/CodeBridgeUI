import React from 'react';
import { CircleCheck, CircleX, Loader2 } from 'lucide-react';
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
    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
      {/* Screen reader announcement region */}
      <span className="sr-only" role="status" aria-live="polite">
        {getAnnouncementText()}
      </span>

      {/* Visual Status Chip */}
      {status === 'checking' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border bg-surface text-text-muted font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-text-muted stroke-[1.5]" />
          Checking…
        </span>
      )}

      {status === 'reachable' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-success/30 bg-success/10 text-success font-medium">
          <CircleCheck className="w-4 h-4 text-success stroke-[1.5]" />
          Connected
        </span>
      )}

      {(status === 'unreachable' || status === 'mixed-content' || status === 'not-configured') && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-danger/30 bg-danger/10 text-danger font-medium">
          <CircleX className="w-4 h-4 text-danger stroke-[1.5]" />
          Unreachable
        </span>
      )}

      {/* Host text */}
      {host && (
        <span className="text-text-muted">
          Grafana at <span className="font-mono text-text">{host}</span>
        </span>
      )}

      {/* Last checked timestamp */}
      {lastChecked && (
        <span className="text-text-muted">
          Last checked {formatTime(lastChecked)}
        </span>
      )}
    </div>
  );
};
