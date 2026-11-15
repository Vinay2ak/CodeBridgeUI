import { useSyncExternalStore } from 'react';
import { CbEvent, RealtimeStatus } from './types';

export interface EventStoreState {
  events: CbEvent[];
  unreadCount: number;
  status: RealtimeStatus;
  reconnectCountdown: number; // in seconds, when reconnecting
}

class EventStore {
  private events: CbEvent[] = [];
  private readIds: Set<string> = new Set();
  private status: RealtimeStatus = 'offline';
  private reconnectCountdown = 0;
  private listeners: Set<() => void> = new Set();

  private snapshot: EventStoreState = {
    events: [],
    unreadCount: 0,
    status: 'offline',
    reconnectCountdown: 0,
  };

  private updateSnapshot() {
    this.snapshot = {
      events: this.events,
      unreadCount: this.events.filter((e) => !this.readIds.has(e.id)).length,
      status: this.status,
      reconnectCountdown: this.reconnectCountdown,
    };
  }

  private emit() {
    this.updateSnapshot();
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): EventStoreState => {
    return this.snapshot;
  };

  setStatus(status: RealtimeStatus, reconnectCountdown = 0) {
    this.status = status;
    this.reconnectCountdown = reconnectCountdown;
    this.emit();
  }

  // Initial events from GET /notifications (count as already read)
  initNotifications(initialEvents: CbEvent[]) {
    for (const e of initialEvents) {
      this.readIds.add(e.id);
    }
    this.mergeEvents(initialEvents);
  }

  // Add live event (counts towards unread)
  addLiveEvent(event: CbEvent) {
    if (this.events.some((e) => e.id === event.id)) {
      return; // Deduplicate
    }
    this.events = [event, ...this.events].slice(0, 30);
    this.emit();
  }

  mergeEvents(events: CbEvent[]) {
    const existingMap = new Map<string, CbEvent>();
    // Add existing
    for (const e of this.events) {
      existingMap.set(e.id, e);
    }
    // Add new
    for (const e of events) {
      if (!existingMap.has(e.id)) {
        existingMap.set(e.id, e);
      }
    }
    // Sort newest first
    const sorted = Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
    // Capped at 30
    this.events = sorted.slice(0, 30);
    this.emit();
  }

  markAllRead() {
    for (const e of this.events) {
      this.readIds.add(e.id);
    }
    this.emit();
  }

  reset() {
    this.events = [];
    this.readIds.clear();
    this.status = 'offline';
    this.reconnectCountdown = 0;
    this.emit();
  }
}

export const eventStore = new EventStore();

export function useEventStore(): EventStoreState {
  return useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);
}
