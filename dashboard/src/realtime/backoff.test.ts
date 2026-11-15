import { describe, it, expect } from 'vitest';
import { nextDelay } from './backoff';

describe('Realtime backoff nextDelay', () => {
  it('respects +-20% jitter bounds for attempt 0', () => {
    for (let i = 0; i < 50; i++) {
      const delay = nextDelay(0);
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1200);
    }
  });

  it('respects +-20% jitter bounds for attempt 1', () => {
    for (let i = 0; i < 50; i++) {
      const delay = nextDelay(1);
      expect(delay).toBeGreaterThanOrEqual(1600);
      expect(delay).toBeLessThanOrEqual(2400);
    }
  });

  it('caps delay at 30,000 ms with +-20% jitter for high attempts', () => {
    for (let i = 0; i < 50; i++) {
      const delay = nextDelay(8); // 1000 * 2^8 = 256,000 -> capped at 30,000
      expect(delay).toBeGreaterThanOrEqual(24000);
      expect(delay).toBeLessThanOrEqual(36000);
    }
  });
});

