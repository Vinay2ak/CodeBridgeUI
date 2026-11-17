import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http } from './http';
import { ApiError } from './errors';

describe('HTTP Client & Error Normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes canonical backend error JSON envelope into ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
          },
          request_id: '8c6b7588-4ff5-4ca3-b89e-ec86b51cfa44',
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': '8c6b7588-4ff5-4ca3-b89e-ec86b51cfa44',
          },
        }
      )
    );

    try {
      await http.post('/api/v1/projects', {});
      expect.fail('Should have thrown ApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.detail).toBe('Request validation failed.');
      expect(err.correlationId).toBe('8c6b7588-4ff5-4ca3-b89e-ec86b51cfa44');
    }
  });

  it('transforms non-JSON HTML tunnel response into SERVICE_UNAVAILABLE', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        '<!DOCTYPE html><html><body><h1>Tunnel reminder page</h1></body></html>',
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-Correlation-Id': 'tunnel-corr-1',
          },
        }
      )
    );

    try {
      await http.get('/api/v1/projects');
      expect.fail('Should have thrown ApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(503);
      expect(err.code).toBe('SERVICE_UNAVAILABLE');
      expect(err.detail).toBe(
        'The API answered with a page instead of JSON. Check VITE_GATEWAY_URL.'
      );
    }
  });
});
