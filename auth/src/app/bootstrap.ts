import { VITE_USE_MOCKS } from "../lib/env";
import { ApiError, setAccessToken } from "../lib/http";
import { readMockCookie } from "../mocks/cookie";
import { getMe, refresh } from "../services/identity/api";
import type { User } from "../services/identity/types";
import { clearSession, setSession } from "../session/session";

export type BootstrapResult =
  | { status: "authenticated"; user: User }
  | { status: "anonymous" }
  | { status: "unavailable" };

export async function restoreSession(): Promise<BootstrapResult> {
  // Fast path for mock mode: if there's no mock_rt cookie, the user is anonymous immediately
  if (VITE_USE_MOCKS && typeof document !== "undefined") {
    const cookie = readMockCookie();
    if (!cookie) {
      clearSession();
      return { status: "anonymous" };
    }
  }

  // Use a snappy timeout (2.5s) for background session restoration so anonymous users load instantly
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), 2500);

  try {
    // In real mode, refresh token is an httpOnly cookie sent automatically via credentials: "include"
    const { accessToken } = await refresh(controller.signal);
    setAccessToken(accessToken);
    const user = await getMe(controller.signal);
    setSession({ user, accessToken });
    return { status: "authenticated", user };
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.status === 503 || err.status === 502 || err.code === "SERVICE_UNAVAILABLE")
    ) {
      return { status: "unavailable" };
    }
    // If not authenticated or request timed out, proceed immediately as anonymous
    clearSession();
    return { status: "anonymous" };
  } finally {
    globalThis.clearTimeout(timer);
  }
}
