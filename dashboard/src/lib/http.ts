import { ApiError } from './errors';
import { callLog } from './callLog';
import { env } from './env';
import { getAccessToken, executeRefresh, notifySuspended } from './authHeader';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  _isRetry?: boolean;
}

export async function httpRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 6000,
    skipAuth = false,
    _isRetry = false,
    headers: customHeaders = {},
    ...customOptions
  } = options;

  const method = (customOptions.method || 'GET').toUpperCase();
  const baseUrl = env.VITE_API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const startTime = Date.now();
  const controller = typeof globalThis.AbortController !== 'undefined'
    ? new globalThis.AbortController()
    : new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && !(customOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (!skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let correlationId = 'unknown';

  try {
    const fetchSignal = (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')
      ? undefined
      : controller.signal;

    const response = await fetch(url, {
      ...customOptions,
      method,
      headers,
      credentials: 'include',
      signal: fetchSignal,
    });

    clearTimeout(timer);
    const duration = Date.now() - startTime;
    correlationId = response.headers.get('X-Correlation-Id') || 'unknown';

    // Log call
    callLog.addLog({
      method,
      path: cleanEndpoint,
      status: response.status,
      ms: duration,
      correlationId,
      at: new Date().toISOString(),
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }
    }

    if (!response.ok) {
      const status = response.status;
      const code = data?.code || (status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'ERROR');
      const detail = data?.detail || data?.title || response.statusText;
      const retryAfter = response.headers.get('Retry-After')
        ? parseInt(response.headers.get('Retry-After')!, 10)
        : undefined;

      // Handle ACCOUNT_SUSPENDED
      if (code === 'ACCOUNT_SUSPENDED') {
        notifySuspended();
        throw new ApiError({
          status,
          code,
          detail,
          correlationId,
          retryAfter,
        });
      }

      // Handle 401 TOKEN_EXPIRED replay
      if (status === 401 && code === 'TOKEN_EXPIRED' && !_isRetry) {
        try {
          const newToken = await executeRefresh();
          if (newToken) {
            // Replay once with new token
            return httpRequest<T>(endpoint, {
              ...options,
              _isRetry: true,
            });
          }
        } catch (refreshErr) {
          throw new ApiError({
            status,
            code,
            detail,
            correlationId,
            retryAfter,
          });
        }
      }

      throw new ApiError({
        status,
        code,
        detail,
        correlationId,
        retryAfter,
      });
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    const duration = Date.now() - startTime;

    if (err instanceof ApiError) {
      throw err;
    }

    const isTimeout = err?.name === 'AbortError';
    const errorCorrelationId = correlationId !== 'unknown' ? correlationId : `client-${Date.now()}`;

    callLog.addLog({
      method,
      path: cleanEndpoint,
      status: 503,
      ms: duration,
      correlationId: errorCorrelationId,
      at: new Date().toISOString(),
    });

    throw new ApiError({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      detail: isTimeout
        ? 'Request timed out after 10 seconds'
        : err?.message || 'Network request failed',
      correlationId: errorCorrelationId,
    });
  }
}

export const http = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    httpRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    httpRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    httpRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
