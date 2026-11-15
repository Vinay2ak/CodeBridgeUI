import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  RefreshCw,
  Lock,
  BadgeCheck,
  FileCode,
  AlertTriangle,
  Bell,
  Inbox,
} from 'lucide-react';
import { useEventStore } from '../../realtime/store';
import { formatEventSentence } from '../../realtime/formatEvent';
import { formatRelativeTime } from '../../lib/format';
import { CbEvent } from '../../realtime/types';

function getEventIcon(type: string) {
  switch (type) {
    case 'user.registered':
      return <UserPlus className="w-4 h-4 text-primary" />;
    case 'project.status_changed':
      return <RefreshCw className="w-4 h-4 text-primary" />;
    case 'payment.held':
      // Amber/money tone for escrow
      return <Lock className="w-4 h-4 text-money" />;
    case 'payment.released':
      return <BadgeCheck className="w-4 h-4 text-money" />;
    case 'task.assigned':
      return <FileCode className="w-4 h-4 text-primary" />;
    case 'service.degraded':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    default:
      return <Bell className="w-4 h-4 text-text-muted" />;
  }
}

export const ActivityFeed: React.FC = () => {
  const { events } = useEventStore();
  // Relative time refreshed every 30 s
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  if (events.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center text-text-muted gap-2">
        <Inbox className="w-8 h-8 opacity-40" />
        <p className="text-sm font-medium">Waiting for events…</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="divide-y divide-border">
        {events.map((event: CbEvent) => {
          return (
            <li
              key={event.id}
              className="py-3 px-2 sm:px-4 flex items-start gap-3.5 hover:bg-surface-raised/40 transition-colors rounded-md"
            >
              <div className="mt-0.5 p-1.5 rounded-full bg-surface-raised border border-border flex items-center justify-center flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text leading-snug">
                  {formatEventSentence(event)}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                  <span className="font-mono text-[11px] bg-surface-raised px-1.5 py-0.5 rounded border border-border">
                    {event.source}
                  </span>
                  <span>•</span>
                  <span>{formatRelativeTime(event.occurredAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

