import { describe, it, expect } from 'vitest';
import { adaptPaymentsSummary, adaptPaymentState } from './adapters';

describe('Payment Service Adapters', () => {
  // Fixture from FRONTEND_CONTRACT.md Section 5.6
  const contractPaymentSummaryFixture = {
    total_spent: 15000,
    total_escrow: 5000,
    held: 5000,
    pendingRelease: 0,
    released: 10000,
    currency: 'INR',
    items: [
      {
        id: 'escrow-uuid-1',
        projectTitle: 'Fix Stripe webhook signature verification',
        amount: 5000,
        state: 'held',
      },
    ],
  };

  it('adapts backend payment summary fixture from contract', () => {
    const summary = adaptPaymentsSummary(contractPaymentSummaryFixture);

    expect(summary.currency).toBe('INR');
    expect(summary.authorized).toBe(15000);
    expect(summary.held).toBe(5000);
    expect(summary.pendingRelease).toBe(0);
    expect(summary.released).toBe(10000);
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0]).toEqual({
      id: 'escrow-uuid-1',
      projectTitle: 'Fix Stripe webhook signature verification',
      amount: 5000,
      state: 'held',
    });
  });

  it('normalizes payment states correctly', () => {
    expect(adaptPaymentState('held')).toBe('held');
    expect(adaptPaymentState('pending_release')).toBe('release_pending');
    expect(adaptPaymentState('released')).toBe('released');
    expect(adaptPaymentState('other')).toBe('authorized');
  });
});
