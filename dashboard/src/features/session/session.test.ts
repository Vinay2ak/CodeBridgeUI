import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http } from '../../lib/http';
import { sessionStore } from './session';

describe('Session Single-Flight Refresh on 401 TOKEN_EXPIRED', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStore.setState({
      status: 'authenticated',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'owner',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      },
      accessToken: 'expired-token-123',
      expiresAt: Date.now() - 1000,
    });
  });

  it('triggers exactly 1 refresh call when 5 parallel requests encounter 401 TOKEN_EXPIRED', async () => {
    let refreshCallCount = 0;
    let projectsCallCount = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const headers = (init?.headers as Headers) || new Headers(init?.headers);
      const authHeader = headers.get('Authorization');

      if (url.includes('/auth/refresh')) {
        refreshCallCount++;
        return new Response(
          JSON.stringify({
            accessToken: 'new-valid-token-jwt.payload.sig',
            expiresIn: 900,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-Id': 'corr-refresh-1',
            },
          }
        );
      }

      if (url.includes('/projects')) {
        projectsCallCount++;
        // If expired token, return 401 TOKEN_EXPIRED
        if (authHeader === 'Bearer expired-token-123') {
          return new Response(
            JSON.stringify({
              code: 'TOKEN_EXPIRED',
              detail: 'The access token has expired',
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                'X-Correlation-Id': `corr-expired-${projectsCallCount}`,
              },
            }
          );
        }

        // If refreshed token, return 200 OK
        if (authHeader === 'Bearer new-valid-token-jwt.payload.sig') {
          return new Response(
            JSON.stringify({ items: [{ id: 'p1', title: 'Test Project' }] }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Correlation-Id': `corr-success-${projectsCallCount}`,
              },
            }
          );
        }
      }

      return new Response('Not found', { status: 404 });
    });

    // Fire 5 concurrent requests
    const promises = [
      http.get('/projects'),
      http.get('/projects'),
      http.get('/projects'),
      http.get('/projects'),
      http.get('/projects'),
    ];

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    for (const res of results) {
      expect(res).toEqual({ items: [{ id: 'p1', title: 'Test Project' }] });
    }

    // Crucial requirement: 5 parallel requests must trigger EXACTLY 1 refresh call
    expect(refreshCallCount).toBe(1);
    // Initial 5 failed + 5 replays = 10 calls to /projects
    expect(projectsCallCount).toBe(10);
  });
});

