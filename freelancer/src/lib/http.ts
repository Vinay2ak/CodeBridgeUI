import { ApiError } from "./errors";
import { appendCallLog } from "./callLog";
import { env } from "./env";

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  _isRetry?: boolean;
}

let getAccessTokenFn: () => string | null = () => null;
let refreshSessionFn: () => Promise<string | null> = () => Promise.resolve(null);
let refreshPromise: Promise<string | null> | null = null;

export function configureHttpAuth(
  getToken: () => string | null,
  refreshToken: () => Promise<string | null>
): void {
  getAccessTokenFn = getToken;
  refreshSessionFn = refreshToken;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 10000;
  const isRetry = options._isRetry ?? false;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${env.apiBaseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = getAccessTokenFn();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  let correlationId = "unknown";

  try {
    response = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const ms = Date.now() - startTime;
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    const status = 503;
    const code = isTimeout ? "GATEWAY_TIMEOUT" : "SERVICE_UNAVAILABLE";
    const detail = isTimeout ? "Request timed out after 10s" : "Network error or service unavailable";

    appendCallLog({
      method,
      path: endpoint,
      status,
      ms,
      correlationId: "net_err",
      at: new Date().toISOString(),
    });

    throw new ApiError({
      status,
      code,
      detail,
      correlationId: "net_err",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const ms = Date.now() - startTime;
  correlationId = response.headers.get("x-correlation-id") || response.headers.get("X-Correlation-Id") || "none";

  appendCallLog({
    method,
    path: endpoint,
    status: response.status,
    ms,
    correlationId,
    at: new Date().toISOString(),
  });

  if (response.status === 401 && !isRetry) {
    let errorCode = "";
    try {
      const cloned = response.clone();
      const errJson = await cloned.json();
      errorCode = errJson.code || "";
    } catch {
      // not JSON
    }

    if (errorCode === "TOKEN_EXPIRED") {
      if (!refreshPromise) {
        refreshPromise = refreshSessionFn().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        return request<T>(endpoint, {
          ...options,
          _isRetry: true,
        });
      }
    }
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorCode = "UNKNOWN_ERROR";

    try {
      const errJson = await response.json();
      errorCode = errJson.code || errorCode;
      errorDetail = errJson.detail || errJson.title || errorDetail;
      if (errJson.correlationId) {
        correlationId = errJson.correlationId;
      }
    } catch {
      // Body not JSON
    }

    const retryAfterHeader = response.headers.get("retry-after") || response.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

    throw new ApiError({
      status: response.status,
      code: errorCode,
      detail: errorDetail,
      correlationId,
      retryAfter,
    });
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

