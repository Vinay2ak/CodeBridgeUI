import { useSyncExternalStore } from 'react';
import { ApiError } from '../../lib/errors';
import { identityApi, normalizeUser } from '../../services/identity/api';
import {
  setAccessToken,
  setRefreshHandler,
  setOnSuspendedHandler,
} from '../../lib/authHeader';

export type UserRole = 'owner' | 'freelancer' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
}

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'suspended' | 'expired';

export interface SessionState {
  status: SessionStatus;
  user: User | null;
  accessToken: string | null;
  expiresAt: number | null;
}

function getInitialSession(): SessionState {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('cb_user');
      const savedToken = localStorage.getItem('cb_access_token');
      if (savedUser) {
        const user = JSON.parse(savedUser) as User;
        if (savedToken) {
          setAccessToken(savedToken);
        }
        return {
          status: 'authenticated',
          user,
          accessToken: savedToken || null,
          expiresAt: null,
        };
      }

      // Check mock_rt cookie shared across ports
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)mock_rt=([^;]*)/);
        if (match) {
          const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(match[1]))));
          const mockUser = JSON.parse(jsonStr);
          const user = normalizeUser(mockUser);
          return {
            status: user.status === 'suspended' ? 'suspended' : 'authenticated',
            user,
            accessToken: 'session-token-' + user.id,
            expiresAt: Date.now() + 3600 * 1000,
          };
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return {
    status: 'loading',
    user: null,
    accessToken: null,
    expiresAt: null,
  };
}

let state: SessionState = getInitialSession();

const listeners = new Set<() => void>();
let refreshPromise: Promise<string | null> | null = null;
let proactiveTimer: NodeJS.Timeout | number | null = null;
let reauthCallback: ((token: string) => void) | null = null;

export function registerRealtimeReauth(fn: (token: string) => void) {
  reauthCallback = fn;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const sessionStore = {
  getState(): SessionState {
    return state;
  },

  setState(nextState: Partial<SessionState>) {
    state = { ...state, ...nextState };
    if ('accessToken' in nextState) {
      setAccessToken(nextState.accessToken ?? null);
      if (typeof localStorage !== 'undefined') {
        if (nextState.accessToken) {
          localStorage.setItem('cb_access_token', nextState.accessToken);
        } else {
          localStorage.removeItem('cb_access_token');
        }
      }
    }
    if ('user' in nextState && typeof localStorage !== 'undefined') {
      if (nextState.user) {
        localStorage.setItem('cb_user', JSON.stringify(nextState.user));
      } else {
        localStorage.removeItem('cb_user');
      }
    }
    if (nextState.status === 'anonymous' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('cb_user');
      localStorage.removeItem('cb_access_token');
    }
    emitChange();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
}

// Decode JWT exp (ms) safely for proactive scheduling only
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr);
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function scheduleProactiveRefresh(token: string) {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }

  const expMs = decodeJwtExp(token);
  if (!expMs) return;

  // Proactive refresh 60 s before expiry
  const now = Date.now();
  const delay = Math.max(1000, expMs - now - 60_000);

  proactiveTimer = setTimeout(() => {
    refreshSession().catch(() => {
      // If proactive refresh fails, state handled in refreshSession
    });
  }, delay);
}

/**
 * Single-flight refreshSession: concurrent callers share ONE promise.
 */
export async function refreshSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      let storedRefreshToken: string | undefined = undefined;

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRt = urlParams.get('rt') || urlParams.get('refresh_token');
        if (urlRt) {
          storedRefreshToken = urlRt;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('cb_refresh_token', urlRt);
          }
          urlParams.delete('rt');
          urlParams.delete('refresh_token');
          const newQuery = urlParams.toString();
          const cleanUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
          window.history.replaceState({}, '', cleanUrl);
        }
      }

      if (!storedRefreshToken && typeof localStorage !== 'undefined') {
        storedRefreshToken =
          localStorage.getItem('cb_refresh_token') || localStorage.getItem('cb_rt') || undefined;
      }

      if (!storedRefreshToken && typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)(?:cb_rt|cb_refresh_token)=([^;]*)/);
        if (match) {
          storedRefreshToken = decodeURIComponent(match[1]);
        }
      }

      const data = await identityApi.refresh(storedRefreshToken);

      const token = data.accessToken || data.access_token;
      if (!token) {
        throw new Error('No access token returned from refresh');
      }

      const expiresIn = data.expiresIn || data.expires_in || 900;
      const expMs = decodeJwtExp(token) || Date.now() + expiresIn * 1000;

      if (data.refresh_token) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cb_refresh_token', data.refresh_token);
        }
        if (typeof document !== 'undefined') {
          document.cookie = `cb_rt=${encodeURIComponent(data.refresh_token)}; path=/; max-age=604800; SameSite=Lax`;
        }
      }

      let user: User | null = null;
      const rawUser = data.user || data.data?.user;
      if (rawUser) {
        user = normalizeUser(rawUser);
      }

      sessionStore.setState({
        accessToken: token,
        expiresAt: expMs,
        ...(user ? { user } : {}),
      });

      scheduleProactiveRefresh(token);

      if (reauthCallback) {
        reauthCallback(token);
      }

      return token;
    } catch (err: any) {
      if (proactiveTimer) {
        clearTimeout(proactiveTimer);
        proactiveTimer = null;
      }

      if (err instanceof ApiError && err.code === 'ACCOUNT_SUSPENDED') {
        sessionStore.setState({ status: 'suspended', accessToken: null });
      } else if (state.status === 'authenticated') {
        sessionStore.setState({ status: 'expired', accessToken: null });
      } else {
        sessionStore.setState({ status: 'anonymous', accessToken: null, user: null });
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cb_refresh_token');
          localStorage.removeItem('cb_rt');
        }
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Register handlers with authHeader module
setRefreshHandler(refreshSession);
setOnSuspendedHandler(() => {
  sessionStore.setState({ status: 'suspended', accessToken: null });
});

/**
 * restoreSession() = refresh, then me()
 */
export async function restoreSession(): Promise<User | null> {
  if (!state.user) {
    sessionStore.setState({ status: 'loading' });
  }

  try {
    const token = await refreshSession();
    if (!token) {
      if (!state.user) sessionStore.setState({ status: 'anonymous' });
      return null;
    }

    let user: User | null = state.user;
    if (!user) {
      user = await identityApi.getMe();
    }

    if (user.status === 'suspended') {
      sessionStore.setState({
        status: 'suspended',
        user,
      });
      return user;
    }

    sessionStore.setState({
      status: 'authenticated',
      user,
    });

    return user;
  } catch (err: any) {
    // Fallback: check if mock_rt cookie exists
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)mock_rt=([^;]*)/);
      if (match) {
        try {
          const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(match[1]))));
          const mockUser = JSON.parse(jsonStr);
          const normalized = normalizeUser(mockUser);
          sessionStore.setState({
            status: normalized.status === 'suspended' ? 'suspended' : 'authenticated',
            user: normalized,
            accessToken: 'session-token-' + normalized.id,
            expiresAt: Date.now() + 3600 * 1000,
          });
          return normalized;
        } catch {
          // ignore
        }
      }
    }

    if (err instanceof ApiError && err.code === 'ACCOUNT_SUSPENDED') {
      sessionStore.setState({ status: 'suspended', accessToken: null });
    } else if (err instanceof ApiError && (err.status === 401 || err.code === 'UNAUTHORIZED')) {
      sessionStore.setState({ status: 'anonymous', user: null, accessToken: null });
    } else if (state.user) {
      // Offline / backend unavailable (503 / tunnel down) - keep cached user session active!
      sessionStore.setState({ status: 'authenticated' });
      return state.user;
    } else {
      sessionStore.setState({ status: 'anonymous', user: null, accessToken: null });
    }
    return null;
  }
}

export async function loginWithCredentials(email: string, password: string): Promise<User> {
  const data = await identityApi.login({ email, password });
  const token = data.accessToken || data.access_token;
  if (!token) {
    throw new Error('No access token received');
  }

  if (data.refresh_token && typeof localStorage !== 'undefined') {
    localStorage.setItem('cb_refresh_token', data.refresh_token);
  }

  setAccessToken(token);

  let rawUser = data.user;
  if (!rawUser) {
    rawUser = await identityApi.getMe();
  }

  const user = normalizeUser(rawUser);

  const expMs = decodeJwtExp(token) || Date.now() + (data.expires_in || 900) * 1000;
  sessionStore.setState({
    status: user.status === 'suspended' ? 'suspended' : 'authenticated',
    user,
    accessToken: token,
    expiresAt: expMs,
  });

  scheduleProactiveRefresh(token);

  return user;
}

export function switchRole(newRole: UserRole): void {
  const currentUser = state.user || {
    id: `user-${newRole}-1`,
    email: `${newRole}@codebridge.dev`,
    displayName: `${newRole.charAt(0).toUpperCase() + newRole.slice(1)} User`,
    role: newRole,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  const updatedUser: User = {
    ...currentUser,
    role: newRole,
    displayName:
      currentUser.displayName && !currentUser.displayName.includes('User')
        ? currentUser.displayName
        : `${newRole.charAt(0).toUpperCase() + newRole.slice(1)} User`,
  };

  sessionStore.setState({
    status: 'authenticated',
    user: updatedUser,
  });

  if (typeof document !== 'undefined') {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(updatedUser))));
    document.cookie = `mock_rt=${encoded}; path=/; max-age=604800; SameSite=Lax`;
  }
}

// Global logout BroadcastChannel sync
const authChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('cb-auth')
  : null;

if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data?.type === 'logout') {
      if (proactiveTimer) {
        clearTimeout(proactiveTimer);
        proactiveTimer = null;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cb_refresh_token');
      }
      sessionStore.setState({
        status: 'anonymous',
        user: null,
        accessToken: null,
        expiresAt: null,
      });
    }
  };
}

export async function logout(): Promise<void> {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('cb_refresh_token');
  }

  try {
    await identityApi.logout();
  } catch {
    // Ignore failure
  }

  sessionStore.setState({
    status: 'anonymous',
    user: null,
    accessToken: null,
    expiresAt: null,
  });

  if (authChannel) {
    authChannel.postMessage({ type: 'logout' });
  }
}
