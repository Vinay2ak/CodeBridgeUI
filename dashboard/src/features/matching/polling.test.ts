import { describe, it, expect } from 'vitest';
import { nextPollDelay, MAX_POLLS } from './polling';

describe('polling configuration and delays', () => {
  it('has a maximum cap of 15 polls', () => {
    expect(MAX_POLLS).toBe(15);
  });

  it('calculates the exact stepped backoff delays', () => {
    expect(nextPollDelay(0)).toBe(800);
    expect(nextPollDelay(1)).toBe(1000);
    expect(nextPollDelay(2)).toBe(1500);
    expect(nextPollDelay(3)).toBe(2000);
    expect(nextPollDelay(4)).toBe(2000);
    expect(nextPollDelay(14)).toBe(2000);
  });
});
