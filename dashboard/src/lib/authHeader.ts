let currentAccessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let onSuspendedHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  if (!currentAccessToken) {
    if (typeof localStorage !== 'undefined') {
      currentAccessToken =
        localStorage.getItem('cb_access_token') ||
        localStorage.getItem('cb_token') ||
        null;
    }
    if (!currentAccessToken && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)(?:cb_access_token|cb_token)=([^;]*)/);
      if (match) {
        currentAccessToken = decodeURIComponent(match[1]);
      }
    }
  }
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem('cb_access_token', token);
      localStorage.setItem('cb_token', token);
    } else {
      localStorage.removeItem('cb_access_token');
      localStorage.removeItem('cb_token');
    }
  }
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
