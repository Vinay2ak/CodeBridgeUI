import { useSyncExternalStore } from 'react';
import { ApiError } from '../../lib/errors';
import { identityApi, normalizeUser } from '../../services/identity/api';
import {
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setRefreshHandler,
  setOnSuspendedHandler,
} from '../../lib/authHeader';
import { clearDraft } from '../post-project/draft';

export type UserRole = 'owner' | 'freelancer' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
}

export type SessionStatus =
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'suspended'
  | 'expired';

export interface SessionState {
  status: SessionStatus;
  user: User | null;
  accessToken: string | null;
  expiresAt: number | null;
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

function decodeJwtPayload(token: string): any {
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
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function redirectToWorkspace(
  token?: string | null,
  rt?: string | null,
  user?: User | null
) {
  const workspaceUrl =
    import.meta.env.VITE_WORKSPACE_URL || 'http://localhost:5177/';
  const url = new URL(workspaceUrl, window.location.origin);

  const activeToken = token;
  const activeRt = rt || getRefreshToken();

  if (activeToken) {
    url.searchParams.set('token', activeToken);
    url.searchParams.set('access_token', activeToken);
  }
  if (activeRt) {
    url.searchParams.set('refresh_token', activeRt);
    url.searchParams.set('rt', activeRt);
  }
  if (user) {
    url.searchParams.set('user', JSON.stringify(user));
    url.searchParams.set('role', user.role);
  }

  window.location.replace(url.toString());
}

function getInitialTokenAndUser(): {
  token: string | null;
  rt: string | null;
  user: User | null;
} {
  if (typeof window === 'undefined') {
    return { token: null, rt: null, user: null };
  }

  const url = new URL(window.location.href);
  let incomingToken =
    url.searchParams.get('token') || url.searchParams.get('access_token');
  let incomingRt =
    url.searchParams.get('rt') || url.searchParams.get('refresh_token');
  let incomingUser = url.searchParams.get('user');
  let incomingRole = url.searchParams.get('role');

  if (!incomingToken && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    incomingToken = hashParams.get('token') || hashParams.get('access_token');
    incomingRt = incomingRt || hashParams.get('rt') || hashParams.get('refresh_token');
    incomingUser = incomingUser || hashParams.get('user');
    incomingRole = incomingRole || hashParams.get('role');
  }

  let parsedUser: User | null = null;
  if (incomingUser) {
    try {
      parsedUser = normalizeUser(JSON.parse(incomingUser));
    } catch {
      parsedUser = null;
    }
  } else if (incomingRole) {
    const validRole =
      incomingRole.toLowerCase() === 'admin'
        ? 'admin'
        : incomingRole.toLowerCase() === 'freelancer'
        ? 'freelancer'
        : 'owner';
    parsedUser = {
      id: 'url-user',
      email: `${validRole}@codebridge.dev`,
      displayName: validRole.charAt(0).toUpperCase() + validRole.slice(1),
      role: validRole,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }

  // Save tokens strictly in memory
  if (incomingToken) {
    setAccessToken(incomingToken);
  }
  if (incomingRt) {
    setRefreshToken(incomingRt);
  }

  // If user profile is not yet available but token exists, decode JWT payload
  if (!parsedUser && incomingToken) {
    const payload = decodeJwtPayload(incomingToken);
    if (payload && (payload.sub || payload.id)) {
      const r = (payload.role || 'owner').toLowerCase();
      parsedUser = {
        id: payload.sub || payload.id,
        email: payload.email || '',
        displayName:
          payload.displayName ||
          payload.full_name ||
          payload.email?.split('@')[0] ||
          'User',
        role: r === 'admin' ? 'admin' : r === 'freelancer' ? 'freelancer' : 'owner',
        status: payload.status || 'active',
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Handle freelancer redirection to workspace
  const isFreelancerRoute =
    window.location.pathname.startsWith('/freelancer') ||
    window.location.hash.includes('/freelancer');
  if (parsedUser?.role === 'freelancer' || isFreelancerRoute) {
    redirectToWorkspace(incomingToken, incomingRt, parsedUser);
    return {
      token: incomingToken || null,
      rt: incomingRt || null,
      user: parsedUser,
    };
  }

  // Clean sensitive parameters from URL history
  if (
    url.searchParams.has('token') ||
    url.searchParams.has('access_token') ||
    url.searchParams.has('rt') ||
    url.searchParams.has('refresh_token') ||
    url.searchParams.has('user') ||
    url.searchParams.has('role')
  ) {
    url.searchParams.delete('token');
    url.searchParams.delete('access_token');
    url.searchParams.delete('rt');
    url.searchParams.delete('refresh_token');
    url.searchParams.delete('user');
    url.searchParams.delete('role');
    window.history.replaceState(
      {},
      '',
      url.pathname + (url.search ? url.search : '') + url.hash
    );
  }

  if (incomingToken && parsedUser) {
    return {
      token: incomingToken,
      rt: incomingRt || null,
      user: parsedUser,
    };
  }

  return { token: incomingToken || null, rt: incomingRt || null, user: null };
}

const initialHandoff = getInitialTokenAndUser();

let state: SessionState = initialHandoff.user
  ? {
      status: 'authenticated',
      user: initialHandoff.user,
      accessToken: initialHandoff.token,
      expiresAt: initialHandoff.token ? decodeJwtExp(initialHandoff.token) : null,
    }
  : {
      status: 'loading',
      user: null,
      accessToken: initialHandoff.token,
      expiresAt: null,
    };

const listeners = new Set<() => void>();

let reauthCallback: ((token: string) => void) | null = null;

export function registerRealtimeReauth(fn: (token: string) => void) {
  reauthCallback = fn;
}

export const sessionStore = {
  getState: () => state,
  setState: (nextState: Partial<SessionState>) => {
    state = { ...state, ...nextState };
    if ('accessToken' in nextState) {
      setAccessToken(nextState.accessToken ?? null);
    }
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

let proactiveRefreshTimer: NodeJS.Timeout | number | null = null;

function scheduleProactiveRefresh(token: string) {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  const expMs = decodeJwtExp(token);
  if (!expMs) return;

  const now = Date.now();
  const timeUntilExp = expMs - now;
  // Refresh 60 seconds before expiration, minimum 5 seconds
  const refreshInMs = Math.max(timeUntilExp - 60000, 5000);

  if (timeUntilExp > 0) {
    proactiveRefreshTimer = setTimeout(() => {
      refreshSession().catch(() => {});
    }, refreshInMs);
  }
}

// Single-flight refresh promise
let refreshInFlight: Promise<string | null> | null = null;

export async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const storedRefreshToken = getRefreshToken() || undefined;

      const data = await identityApi.refresh(storedRefreshToken);
      const token = data.accessToken;
      if (!token) {
        throw new Error('No access token returned from refresh');
      }

      const expiresIn = data.expiresIn || 900;
      const expMs = decodeJwtExp(token) || Date.now() + expiresIn * 1000;

      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }

      setAccessToken(token);

      sessionStore.setState({
        status: 'authenticated',
        user: data.user || state.user,
        accessToken: token,
        expiresAt: expMs,
      });

      scheduleProactiveRefresh(token);

      if (reauthCallback) {
        reauthCallback(token);
      }

      return token;
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'ACCOUNT_SUSPENDED') {
        sessionStore.setState({ status: 'suspended', accessToken: null });
        setRefreshToken(null);
        throw err;
      }

      sessionStore.setState({ status: 'anonymous', accessToken: null, user: null });
      setRefreshToken(null);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// Wire single-flight refresh into http client
setRefreshHandler(() => refreshSession());

// Wire account suspended handler
setOnSuspendedHandler(() => {
  sessionStore.setState({ status: 'suspended', accessToken: null });
});

export async function initSession(): Promise<void> {
  if (state.status === 'authenticated' && state.user) {
    if (state.accessToken) {
      scheduleProactiveRefresh(state.accessToken);
    }
    return;
  }

  sessionStore.setState({ status: 'loading' });

  // If we already have an in-memory access token, fetch user profile
  if (state.accessToken) {
    try {
      const user = await identityApi.getMe();
      if (user.role === 'freelancer') {
        redirectToWorkspace(state.accessToken, getRefreshToken(), user);
        return;
      }
      sessionStore.setState({
        status: 'authenticated',
        user,
      });
      scheduleProactiveRefresh(state.accessToken);
      return;
    } catch {
      // Fall through to refresh
    }
  }

  try {
    const token = await refreshSession();
    if (!token) {
      // If refresh fails in mock mode, attempt mock user
      if (import.meta.env.VITE_USE_MOCKS === 'true') {
        try {
          const user = await identityApi.getMe();
          sessionStore.setState({
            status: 'authenticated',
            user,
            accessToken: 'session-token-' + user.id,
            expiresAt: Date.now() + 900000,
          });
          return;
        } catch {
          // ignore
        }
      }
      sessionStore.setState({ status: 'anonymous', user: null, accessToken: null });
    }
  } catch (err: any) {
    if (err instanceof ApiError && err.code === 'ACCOUNT_SUSPENDED') {
      sessionStore.setState({ status: 'suspended', accessToken: null });
    } else {
      sessionStore.setState({ status: 'anonymous', user: null, accessToken: null });
    }
  }
}

export const restoreSession = initSession;

export async function loginWithCredentials(
  email: string,
  pass: string
): Promise<void> {
  sessionStore.setState({ status: 'loading' });
  try {
    const data = await identityApi.login({ email, password: pass });
    const token = data.accessToken;
    if (!token) {
      throw new Error('No access token received');
    }

    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }

    setAccessToken(token);

    const user = data.user;
    if (user.role === 'freelancer') {
      redirectToWorkspace(token, data.refreshToken, user);
      return;
    }

    const expMs = decodeJwtExp(token) || Date.now() + 900 * 1000;

    sessionStore.setState({
      status: 'authenticated',
      user,
      accessToken: token,
      expiresAt: expMs,
    });

    scheduleProactiveRefresh(token);
  } catch (err: any) {
    sessionStore.setState({ status: 'anonymous', user: null, accessToken: null });
    throw err;
  }
}

export async function logout(): Promise<void> {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  try {
    await identityApi.logout();
  } catch {
    // ignore
  }

  setAccessToken(null);
  setRefreshToken(null);
  clearDraft();

  sessionStore.setState({
    status: 'anonymous',
    user: null,
    accessToken: null,
    expiresAt: null,
  });
}

export function handleSessionExpired(): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  setAccessToken(null);
  setRefreshToken(null);

  sessionStore.setState({
    status: 'expired',
    user: null,
    accessToken: null,
    expiresAt: null,
  });
}

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
}
