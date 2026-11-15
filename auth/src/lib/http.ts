import { VITE_GATEWAY_URL } from "./env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly correlationId: string,
    public readonly detail: string,
    public readonly fieldErrors?: { field: string; message: string }[]
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, skipAuth = false, signal } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true",
  };

  if (!skipAuth && _accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const isDevProxy = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== "true";
  const url = isDevProxy ? `/api/v1${path}` : `${VITE_GATEWAY_URL}/api/v1${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: "same-origin",
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    throw fetchErr;
  }
  clearTimeout(timeoutId);

  const correlationId = res.headers.get("X-Correlation-Id") ?? "";

  if (!res.ok) {
    let code = "UNKNOWN_ERROR";
    let detail = res.statusText;
    let fieldErrors: { field: string; message: string }[] | undefined;

    try {
      const json = await res.json();
      code = json.code ?? json.error?.code ?? code;
      detail =
        json.detail ??
        json.error?.message ??
        json.message ??
        json.title ??
        detail;
      if (Array.isArray(json.errors)) {
        fieldErrors = json.errors;
      }
    } catch {
      // non-JSON error body
    }

    throw new ApiError(res.status, code, correlationId, detail, fieldErrors);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
