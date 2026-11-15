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
  if (typeof window !== "undefined") {
    if (session.accessToken) {
      localStorage.setItem("cb_access_token", session.accessToken);
      localStorage.setItem("cb_token", session.accessToken);
      document.cookie = `cb_access_token=${encodeURIComponent(session.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `cb_token=${encodeURIComponent(session.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
    }
    if (session.refreshToken) {
      localStorage.setItem("cb_rt", session.refreshToken);
      localStorage.setItem("cb_refresh_token", session.refreshToken);
      document.cookie = `cb_rt=${encodeURIComponent(session.refreshToken)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `cb_refresh_token=${encodeURIComponent(session.refreshToken)}; path=/; max-age=604800; SameSite=Lax`;
    }
    if (session.user) {
      localStorage.setItem("cb_user", JSON.stringify(session.user));
      try {
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(session.user))));
        document.cookie = `mock_rt=${encodeURIComponent(b64)}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `cb_user=${encodeURIComponent(JSON.stringify(session.user))}; path=/; max-age=604800; SameSite=Lax`;
      } catch {}
    }
  }
}

export function getSession(): Session | null {
  if (!_session && typeof window !== "undefined") {
    try {
      const savedUser = localStorage.getItem("cb_user");
      const savedToken = localStorage.getItem("cb_access_token") || localStorage.getItem("cb_token") || "";
      const savedRt = localStorage.getItem("cb_refresh_token") || localStorage.getItem("cb_rt");
      if (savedUser) {
        _session = {
          user: JSON.parse(savedUser) as User,
          accessToken: savedToken,
          refreshToken: savedRt || undefined,
        };
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return _session;
}

export function clearSession(): void {
  _session = null;
  setAccessToken(null);
  if (typeof window !== "undefined") {
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
    // BroadcastChannel not supported
  }

  return () => {
    _logoutChannel?.close();
    _logoutChannel = null;
  };
}

export function broadcastLogout(): void {
  try {
    const ch = new BroadcastChannel("cb-auth");
    ch.postMessage({ type: "logout" });
    ch.close();
  } catch {
    // ignore
  }
}
