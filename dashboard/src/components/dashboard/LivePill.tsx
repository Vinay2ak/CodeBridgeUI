import React from 'react';
import { Radio, RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';
import { useEventStore } from '../../realtime/store';
import { retryRealtime } from '../../realtime/manager';

export const LivePill: React.FC = () => {
  const { status, reconnectCountdown } = useEventStore();

  let text = 'Offline';
  let icon = <WifiOff className="w-3.5 h-3.5" />;
  let toneClass = 'bg-surface-raised text-text-muted border-border cursor-pointer hover:bg-surface-sunken';

  if (status === 'live') {
    text = 'Live';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-success animate-pulse" />;
    toneClass = 'bg-success/10 text-success border-success/30';
  } else if (status === 'connecting') {
    text = 'Connecting…';
    icon = <Radio className="w-3.5 h-3.5 text-warning animate-spin" />;
    toneClass = 'bg-warning/10 text-warning border-warning/30';
  } else if (status === 'reconnecting') {
    text = `Reconnecting in ${reconnectCountdown}s`;
    icon = <RefreshCw className="w-3.5 h-3.5 text-warning animate-spin" />;
    toneClass = 'bg-warning/10 text-warning border-warning/30';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => {
        if (status === 'offline') {
          retryRealtime();
        }
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${toneClass}`}
      title={status === 'offline' ? 'Realtime is offline. Click to retry.' : `Connection status: ${text}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

