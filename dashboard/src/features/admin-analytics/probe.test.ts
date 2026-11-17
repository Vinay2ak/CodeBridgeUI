import { describe, it, expect, vi } from 'vitest';
import { probeGrafana, isMixedContent } from './probe';

describe('probe module', () => {
  it('1. returns reachable when fetch resolves successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    const result = await probeGrafana('http://backend.internal:3001', {
      fetchImpl: mockFetch as any,
    });

    expect(result).toBe('reachable');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://backend.internal:3001/api/health',
      expect.objectContaining({
        mode: 'no-cors',
        cache: 'no-store',
      })
    );
  });

  it('2. returns reachable even when response is opaque or error status code', async () => {
    // In no-cors mode, cross-origin responses resolve as type="opaque" with status 0
    const mockFetch = vi.fn().mockResolvedValue({ status: 0, type: 'opaque' });
    const result = await probeGrafana('http://backend.internal:3001', {
      fetchImpl: mockFetch as any,
    });

    expect(result).toBe('reachable');
  });

  it('3. returns unreachable on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await probeGrafana('http://backend.internal:3001', {
      fetchImpl: mockFetch as any,
    });

    expect(result).toBe('unreachable');
  });

  it('4. returns unreachable on timeout abort', async () => {
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => {
          reject(new DOMException('The user aborted a request.', 'AbortError'));
        });
      });
    });

    const result = await probeGrafana('http://backend.internal:3001', {
      timeoutMs: 50,
      fetchImpl: mockFetch as any,
    });

    expect(result).toBe('unreachable');
  });

  it('5. correctly identifies mixed content scenarios', () => {
    expect(isMixedContent('https:', 'http:')).toBe(true);
    expect(isMixedContent('https', 'http')).toBe(true);

    // Not mixed content
    expect(isMixedContent('https:', 'https:')).toBe(false);
    expect(isMixedContent('http:', 'http:')).toBe(false);
    expect(isMixedContent('http:', 'https:')).toBe(false);
  });
});
