let currentAccessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let onSuspendedHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
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

