import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useEventStore, eventStore } from '../../realtime/store';
import { formatEventSentence } from '../../realtime/formatEvent';
import { formatRelativeTime } from '../../lib/format';

export const NotificationBell: React.FC = () => {
  const { events, unreadCount } = useEventStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  const latestEvents = events.slice(0, 10);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative p-2 rounded-md border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-raised transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Recent notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md bg-surface border border-border shadow-xl p-3 z-50 text-text animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => eventStore.markAllRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
            {latestEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">
                No notifications yet
              </div>
            ) : (
              latestEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded bg-surface-raised/60 hover:bg-surface-raised transition-colors text-xs"
                >
                  <p className="font-medium text-text leading-snug">
                    {formatEventSentence(event)}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-text-muted">
                    <span className="font-mono">{event.source}</span>
                    <span>{formatRelativeTime(event.occurredAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

