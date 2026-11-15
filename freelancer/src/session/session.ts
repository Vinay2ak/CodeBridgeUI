import { env } from "../lib/env";
import { configureHttpAuth, request } from "../lib/http";
import { ApiError } from "../lib/errors";
import { realtimeManager } from "../realtime/manager";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "freelancer" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  onboardingCompleted: boolean;
}

export type SessionStatus = "loading" | "authenticated" | "unavailable" | "suspended" | "expired";

export interface SessionState {
  status: SessionStatus;
  user: User | null;
  accessToken: string | null;
  expiresAt: number | null;
}

class SessionStore {
  private state: SessionState = {
    status: "loading",
    user: null,
    accessToken: null,
    expiresAt: null,
  };

  private listeners = new Set<(state: SessionState) => void>();
  private refreshPromise: Promise<string | null> | null = null;
  private proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private authChannel: BroadcastChannel | null = null;

  constructor() {
    configureHttpAuth(
      () =>
        this.state.accessToken ||
        (typeof localStorage !== "undefined"
          ? localStorage.getItem("cb_access_token") ||
            localStorage.getItem("cb_token")
          : null),
      () => this.refreshSession()
    );

    if (typeof BroadcastChannel !== "undefined") {
      this.authChannel = new BroadcastChannel("cb-auth");
      this.authChannel.onmessage = (event) => {
        if (event.data?.type === "logout") {
          this.handleExternalLogout();
        }
      };
    }
  }

  public getState(): SessionState {
    return this.state;
  }

  public subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(partial: Partial<SessionState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public async restoreSession(): Promise<void> {
    try {
      this.setState({ status: "loading" });
      const token = await this.refreshSession();
      if (!token) {
        window.location.assign(env.signinUrl);
        return;
      }

      // Fetch user profile only if not already provided by refresh response
      let user: User | null = this.state.user;
      if (!user) {
        let rawUser: any;
        try {
          rawUser = await request<any>("/auth/me");
        } catch {
          rawUser = await request<any>("/users/me");
        }

        const userObj = rawUser?.user || rawUser?.data || rawUser || {};
        const roleStr = (userObj.role || "freelancer").toLowerCase();
        user = {
          id: userObj.id || "anonymous",
          email: userObj.email || "",
          displayName: userObj.full_name || userObj.displayName || userObj.email?.split("@")[0] || "Freelancer",
          role: roleStr as "freelancer",
          status: userObj.is_active === false || userObj.status === "suspended" ? "suspended" : "active",
          createdAt: userObj.created_at || userObj.createdAt || new Date().toISOString(),
          onboardingCompleted: true,
        };
      }

      if (user.status === "suspended") {
        this.setState({ status: "suspended", user });
        return;
      }

      // Guards per contract item 4
      if (user.onboardingCompleted === false) {
        window.location.assign(`${env.registerUrl}?resume=1`);
        return;
      }

      if (user.role !== "freelancer") {
        window.location.assign(`${env.dashboardUrl}/${user.role}`);
        return;
      }

      this.setState({
        status: "authenticated",
        user,
      });

      realtimeManager.start(token);
    } catch (err: unknown) {
      if (this.state.user && (this.state.accessToken || typeof localStorage !== "undefined" && localStorage.getItem("cb_access_token"))) {
        this.setState({ status: "authenticated" });
        return;
      }
      if (err instanceof ApiError) {
        if (err.code === "ACCOUNT_SUSPENDED" || err.status === 403) {
          this.setState({ status: "suspended" });
          return;
        }
        if (err.status === 401) {
          window.location.assign(env.signinUrl);
          return;
        }
        if (err.status === 503) {
          this.setState({ status: "unavailable" });
          return;
        }
      }
      window.location.assign(env.signinUrl);
    }
  }

  public refreshSession(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        let storedToken: string | null = null;
        let storedRt: string | null = null;

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(
            window.location.hash.replace(/^#\/?/, "")
          );

          const urlToken =
            urlParams.get("token") ||
            urlParams.get("access_token") ||
            urlParams.get("accessToken") ||
            hashParams.get("token") ||
            hashParams.get("access_token");

          const urlRt =
            urlParams.get("rt") ||
            urlParams.get("refresh_token") ||
            urlParams.get("refreshToken") ||
            hashParams.get("rt") ||
            hashParams.get("refresh_token");

          const urlUser = urlParams.get("user") || hashParams.get("user");
          let initialUser: User | null = null;
          if (urlUser) {
            try {
              initialUser = JSON.parse(decodeURIComponent(urlUser));
            } catch {
              try {
                initialUser = JSON.parse(urlUser);
              } catch {}
            }
            if (initialUser && typeof localStorage !== "undefined") {
              localStorage.setItem("cb_user", JSON.stringify(initialUser));
            }
          }

          if (urlToken) {
            storedToken = urlToken;
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("cb_access_token", urlToken);
              localStorage.setItem("cb_token", urlToken);
            }
            urlParams.delete("token");
            urlParams.delete("access_token");
            urlParams.delete("accessToken");
          }

          if (urlRt) {
            storedRt = urlRt;
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("cb_refresh_token", urlRt);
              localStorage.setItem("cb_rt", urlRt);
            }
            urlParams.delete("rt");
            urlParams.delete("refresh_token");
            urlParams.delete("refreshToken");
          }
          if (urlUser) {
            urlParams.delete("user");
            urlParams.delete("role");
          }

          if (urlToken || urlRt || urlUser) {
            const newQuery = urlParams.toString();
            const cleanUrl = `${window.location.pathname}${
              newQuery ? `?${newQuery}` : ""
            }`;
            window.history.replaceState({}, "", cleanUrl);
          }
        }

        if (!storedToken && typeof localStorage !== "undefined") {
          storedToken =
            localStorage.getItem("cb_access_token") ||
            localStorage.getItem("cb_token");
        }

        if (!storedRt && typeof localStorage !== "undefined") {
          storedRt =
            localStorage.getItem("cb_refresh_token") ||
            localStorage.getItem("cb_rt");
        }

        if (!storedRt && typeof document !== "undefined") {
          const match = document.cookie.match(
            /(?:^|;\s*)(?:cb_rt|cb_refresh_token)=([^;]*)/
          );
          if (match) {
            storedRt = decodeURIComponent(match[1]);
          }
        }

        if (!storedRt && !storedToken && !env.useMocks) {
          return null;
        }

        let accessToken: string | null = storedToken;
        let expiresIn = 900;
        let user: User | null = null;

        if (storedRt || env.useMocks) {
          try {
            const data = await request<any>("/auth/refresh", {
              method: "POST",
              body: storedRt ? JSON.stringify({ refresh_token: storedRt }) : undefined,
              skipAuth: true,
            });

            if (data.accessToken || data.access_token) {
              accessToken = data.accessToken || data.access_token;
            }
            if (data.refresh_token && typeof localStorage !== "undefined") {
              localStorage.setItem("cb_refresh_token", data.refresh_token);
            }
            expiresIn = data.expiresIn || data.expires_in || 900;

            const rawUser = data.user || data.data?.user;
            if (rawUser) {
              const roleStr = (rawUser.role || "freelancer").toLowerCase();
              user = {
                id: rawUser.id || "anonymous",
                email: rawUser.email || "",
                displayName:
                  rawUser.full_name ||
                  rawUser.displayName ||
                  rawUser.email?.split("@")[0] ||
                  "Freelancer",
                role: roleStr as "freelancer",
                status:
                  rawUser.is_active === false || rawUser.status === "suspended"
                    ? "suspended"
                    : "active",
                createdAt:
                  rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
                onboardingCompleted: true,
              };
            }
          } catch (refreshErr) {
            // If refresh fails but we have a saved token, use the saved token
            if (!storedToken) throw refreshErr;
          }
        }

        if (!accessToken && !env.useMocks) {
          return null;
        }

        if (accessToken && typeof localStorage !== "undefined") {
          localStorage.setItem("cb_access_token", accessToken);
        }

        if (!user && typeof localStorage !== "undefined") {
          const savedUser = localStorage.getItem("cb_user");
          if (savedUser) {
            try {
              user = JSON.parse(savedUser);
            } catch {}
          }
        }

        const expiresAt = Date.now() + expiresIn * 1000;

        this.setState({
          accessToken,
          expiresAt,
          ...(user ? { user } : {}),
        });

        if (accessToken) {
          realtimeManager.reauth(accessToken);
        }
        this.scheduleProactiveRefresh(expiresIn);

        return accessToken;
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.code === "ACCOUNT_SUSPENDED") {
            this.setState({ status: "suspended" });
            return null;
          }
          if (err.status === 401 && this.state.status === "authenticated") {
            this.setState({ status: "expired" });
            return null;
          }
        }
        if (this.state.status === "authenticated") {
          this.setState({ status: "expired" });
        }
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private scheduleProactiveRefresh(expiresInSec: number): void {
    if (this.proactiveRefreshTimer) {
      clearTimeout(this.proactiveRefreshTimer);
    }
    // Proactive refresh 60 s before expiry (or half time if shorter)
    const delaySec = Math.max(5, expiresInSec - 60);
    this.proactiveRefreshTimer = setTimeout(() => {
      if (this.state.status === "authenticated") {
        this.refreshSession();
      }
    }, delaySec * 1000);
  }

  public async logout(): Promise<void> {
    if (this.proactiveRefreshTimer) {
      clearTimeout(this.proactiveRefreshTimer);
    }
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Ignore failure per contract
    }

    this.clearLocalSession();

    if (this.authChannel) {
      this.authChannel.postMessage({ type: "logout" });
    }

    window.location.assign(env.signinUrl);
  }

  private handleExternalLogout(): void {
    this.clearLocalSession();
    window.location.assign(env.signinUrl);
  }

  private clearLocalSession(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("cb_access_token");
      localStorage.removeItem("cb_token");
      localStorage.removeItem("cb_refresh_token");
      localStorage.removeItem("cb_rt");
    }
    realtimeManager.stop();
    this.setState({
      status: "loading",
      user: null,
      accessToken: null,
      expiresAt: null,
    });
  }
}

export const sessionStore = new SessionStore();

