import { describe, it, expect } from 'vitest';
import { sizeFromBudget } from './size';

describe('sizeFromBudget', () => {
  it('returns MICRO_BUG for budget of 2999', () => {
    const size = sizeFromBudget(2999);
    expect(size.value).toBe('MICRO_BUG');
    expect(size.label).toBe('Micro-bug');
  });

  it('returns FEATURE_INTEGRATION for budget of 3000', () => {
    const size = sizeFromBudget(3000);
    expect(size.value).toBe('FEATURE_INTEGRATION');
    expect(size.label).toBe('Feature or integration');
  });

  it('returns FEATURE_INTEGRATION for budget of 7500', () => {
    const size = sizeFromBudget(7500);
    expect(size.value).toBe('FEATURE_INTEGRATION');
    expect(size.label).toBe('Feature or integration');
  });

  it('returns COMPLEX_MODULE for budget of 7501', () => {
    const size = sizeFromBudget(7501);
    expect(size.value).toBe('COMPLEX_MODULE');
    expect(size.label).toBe('Complex module');
  });
});
