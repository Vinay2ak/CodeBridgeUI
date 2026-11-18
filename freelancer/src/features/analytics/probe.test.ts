import { describe, it, expect, vi } from 'vitest';
import { probeGrafana, isMixedContent } from './probe';

describe('probe module', () => {
  it('1. correctly identifies mixed-content scenarios', () => {
    expect(isMixedContent('https:', 'http:')).toBe(true);
    expect(isMixedContent('http:', 'http:')).toBe(false);
    expect(isMixedContent('https:', 'https:')).toBe(false);
    expect(isMixedContent('http:', 'https:')).toBe(false);
  });

  it('2. returns reachable when fetch succeeds', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const result = await probeGrafana('http://monitoring.local:3001', {
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(result).toBe('reachable');
  });

  it('3. returns unreachable when fetch rejects', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const result = await probeGrafana('http://monitoring.local:3001', {
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(result).toBe('unreachable');
  });
});
