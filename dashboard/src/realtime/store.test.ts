import { describe, it, expect, beforeEach } from 'vitest';
import { eventStore } from './store';
import { CbEvent } from './types';

describe('Realtime eventStore', () => {
  beforeEach(() => {
    eventStore.reset();
  });

  it('marks initial notifications as read, deduplicates, and maintains newest-first order', () => {
    const initialEvents: CbEvent[] = [
      {
        id: 'ev-1',
        type: 'project.status_changed',
        occurredAt: '2026-01-01T10:00:00Z',
        source: 'project-service',
        correlationId: 'c1',
        data: {},
      },
      {
        id: 'ev-2',
        type: 'payment.held',
        occurredAt: '2026-01-01T11:00:00Z',
        source: 'payment-service',
        correlationId: 'c2',
        data: {},
      },
    ];

    eventStore.initNotifications(initialEvents);

    const snapshot1 = eventStore.getSnapshot();
    // Initial notifications count as already read
    expect(snapshot1.unreadCount).toBe(0);
    expect(snapshot1.events).toHaveLength(2);
    // Newest first
    expect(snapshot1.events[0].id).toBe('ev-2');

    // Deduplication check: adding existing event does not duplicate
    eventStore.addLiveEvent(initialEvents[0]);
    expect(eventStore.getSnapshot().events).toHaveLength(2);
  });

  it('increments unreadCount on live events and markAllRead clears unread count', () => {
    const liveEvent: CbEvent = {
      id: 'ev-live-1',
      type: 'user.registered',
      occurredAt: '2026-01-01T12:00:00Z',
      source: 'identity-service',
      correlationId: 'c3',
      data: {},
    };

    eventStore.addLiveEvent(liveEvent);
    expect(eventStore.getSnapshot().unreadCount).toBe(1);

    const liveEvent2: CbEvent = {
      id: 'ev-live-2',
      type: 'payment.released',
      occurredAt: '2026-01-01T13:00:00Z',
      source: 'payment-service',
      correlationId: 'c4',
      data: {},
    };

    eventStore.addLiveEvent(liveEvent2);
    expect(eventStore.getSnapshot().unreadCount).toBe(2);

    eventStore.markAllRead();
    expect(eventStore.getSnapshot().unreadCount).toBe(0);
  });

  it('caps the event list at 30 items', () => {
    for (let i = 1; i <= 40; i++) {
      eventStore.addLiveEvent({
        id: `ev-${i}`,
        type: 'test.event',
        occurredAt: new Date(Date.now() + i * 1000).toISOString(),
        source: 'test',
        correlationId: `c-${i}`,
        data: {},
      });
    }

    const snapshot = eventStore.getSnapshot();
    expect(snapshot.events).toHaveLength(30);
    // Most recent is ev-40
    expect(snapshot.events[0].id).toBe('ev-40');
  });
});

