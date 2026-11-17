import { describe, it, expect } from 'vitest';
import { adaptNotification, adaptNotificationsResponse } from './adapters';

describe('Notification Service Adapters', () => {
  // Fixture from FRONTEND_CONTRACT.md Section 5.8
  const contractNotificationFixture = {
    items: [
      {
        id: 'notif-uuid-1',
        user_id: 'usr-uuid-1',
        type: 'PAYMENT_HELD',
        title: 'Payment Held in Escrow',
        message: 'INR 5,000 has been secured for Fix Stripe webhook.',
        is_read: false,
        created_at: '2026-11-13T10:05:00Z',
      },
    ],
    total_unread: 1,
  };

  it('adapts backend notification item to CbEvent', () => {
    const raw = contractNotificationFixture.items[0];
    const event = adaptNotification(raw);

    expect(event.id).toBe('notif-uuid-1');
    expect(event.type).toBe('payment.held');
    expect(event.occurredAt).toBe('2026-11-13T10:05:00Z');
    expect(event.source).toBe('notification-service');
    expect(event.data).toMatchObject({
      title: 'Payment Held in Escrow',
      message: 'INR 5,000 has been secured for Fix Stripe webhook.',
      isRead: false,
    });
  });

  it('adapts backend notifications response envelope', () => {
    const response = adaptNotificationsResponse(contractNotificationFixture);

    expect(response.items).toHaveLength(1);
    expect(response.items[0].id).toBe('notif-uuid-1');
  });
});
