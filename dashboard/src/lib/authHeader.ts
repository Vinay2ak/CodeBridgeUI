let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let onSuspendedHandler: (() => void) | null = null;

/**
 * Access token stays in memory only.
 */
export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

/**
 * If backend returns refresh token in body, keep it in memory only.
 */
export function getRefreshToken(): string | null {
  return currentRefreshToken;
}

export function setRefreshToken(token: string | null): void {
  currentRefreshToken = token;
}

export function setRefreshHandler(handler: () => Promise<string | null>): void {
  refreshHandler = handler;
}

export function setOnSuspendedHandler(handler: () => void): void {
  onSuspendedHandler = handler;
}

export async function executeRefresh(): Promise<string | null> {
  if (refreshHandler) {
    return refreshHandler();
  }
  return null;
}

export function notifySuspended(): void {
  if (onSuspendedHandler) {
    onSuspendedHandler();
  }
}
