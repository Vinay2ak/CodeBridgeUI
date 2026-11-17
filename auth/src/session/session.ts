import { VITE_USE_MOCKS } from "../lib/env";
import { setAccessToken } from "../lib/http";
import type { User } from "../services/identity/types";

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

let _session: Session | null = null;
let _logoutChannel: BroadcastChannel | null = null;
let _onLogout: (() => void) | null = null;

export function setSession(session: Session): void {
  _session = session;
  setAccessToken(session.accessToken);

  // In mock mode, preserve mock cookies and mock state for simulated persistence
  if (VITE_USE_MOCKS && typeof window !== "undefined") {
    if (session.user) {
      try {
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(session.user))));
        document.cookie = `mock_rt=${encodeURIComponent(b64)}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `cb_user=${encodeURIComponent(JSON.stringify(session.user))}; path=/; max-age=604800; SameSite=Lax`;
      } catch {
        // ignore cookie write errors
      }
    }
  }

  // In real backend mode: DO NOT use localStorage or sessionStorage for tokens.
  // The access token stays in memory only.
  // The refresh token travels as an httpOnly cookie set by the backend.
}

export function getSession(): Session | null {
  return _session;
}

export function clearSession(): void {
  _session = null;
  setAccessToken(null);

  if (typeof window !== "undefined") {
    if (VITE_USE_MOCKS) {
      localStorage.removeItem("cb_access_token");
      localStorage.removeItem("cb_token");
      localStorage.removeItem("cb_rt");
      localStorage.removeItem("cb_refresh_token");
      localStorage.removeItem("cb_user");
      document.cookie = "cb_access_token=; path=/; max-age=0";
      document.cookie = "cb_token=; path=/; max-age=0";
      document.cookie = "cb_user=; path=/; max-age=0";
      document.cookie = "cb_rt=; path=/; max-age=0";
      document.cookie = "cb_refresh_token=; path=/; max-age=0";
      document.cookie = "mock_rt=; path=/; max-age=0";
    }
  }
}

export function initLogoutSync(onLogout: () => void): () => void {
  _onLogout = onLogout;
  try {
    _logoutChannel = new BroadcastChannel("cb-auth");
    _logoutChannel.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "logout") {
        clearSession();
        _onLogout?.();
      }
    };
  } catch {
    // BroadcastChannel not supported in environment
  }

  return () => {
    _logoutChannel?.close();
    _logoutChannel = null;
  };
}

export function broadcastLogout(): void {
  try {
    if (!_logoutChannel) {
      _logoutChannel = new BroadcastChannel("cb-auth");
    }
    _logoutChannel.postMessage({ type: "logout" });
  } catch {
    // BroadcastChannel error ignored
  }
}
