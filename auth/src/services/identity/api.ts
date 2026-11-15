import { VITE_USE_MOCKS } from "../../lib/env";
import { apiFetch } from "../../lib/http";
import type {
  AuthResponse,
  RefreshResponse,
  User,
  OwnerProfile,
  SaveOwnerProfileResponse,
} from "./types";

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: "owner" | "freelancer";
}

interface RawBackendUser {
  id: string;
  email: string;
  full_name?: string;
  displayName?: string;
  role?: string;
  is_active?: boolean;
  status?: "active" | "suspended";
  created_at?: string;
  createdAt?: string;
  onboarding_completed?: boolean;
  onboardingCompleted?: boolean;
}

interface RawAuthResponse {
  user?: RawBackendUser;
  id?: string;
  email?: string;
  full_name?: string;
  displayName?: string;
  role?: string;
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  expires_in?: number;
  expiresIn?: number;
}

function normalizeUser(raw: RawBackendUser): User {
  const roleStr = (raw.role || "owner").toLowerCase();
  const role: "owner" | "freelancer" | "admin" =
    roleStr === "freelancer" ? "freelancer" : roleStr === "admin" ? "admin" : "owner";

  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.full_name || raw.displayName || "",
    role,
    status: raw.is_active === false || raw.status === "suspended" ? "suspended" : "active",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    onboardingCompleted: raw.onboardingCompleted ?? raw.onboarding_completed ?? true,
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  if (VITE_USE_MOCKS) {
    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  }

  // Real backend expects full_name and uppercase role
  await apiFetch<unknown>("/auth/register", {
    method: "POST",
    body: {
      full_name: payload.displayName,
      email: payload.email,
      password: payload.password,
      role: payload.role === "freelancer" ? "FREELANCER" : "OWNER",
    },
    skipAuth: true,
  });

  // Automatically log in to retrieve session tokens
  return login(payload.email, payload.password);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<RawAuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });

  const rawUser = data.user || (data as unknown as RawBackendUser);
  const user = normalizeUser(rawUser);
  const accessToken = data.access_token || data.accessToken || "";
  const refreshToken = data.refresh_token || data.refreshToken;
  const expiresIn = data.expires_in ?? data.expiresIn ?? 900;

  return {
    user,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

export async function refresh(signal?: AbortSignal): Promise<RefreshResponse> {
  const storedRt = typeof window !== "undefined" ? localStorage.getItem("cb_rt") : null;
  const data = await apiFetch<RawAuthResponse>("/auth/refresh", {
    method: "POST",
    body: storedRt ? { refresh_token: storedRt } : undefined,
    skipAuth: true,
    signal,
  });

  return {
    accessToken: data.access_token || data.accessToken || "",
    refreshToken: data.refresh_token || data.refreshToken,
    expiresIn: data.expires_in ?? data.expiresIn ?? 900,
  };
}

export async function getMe(signal?: AbortSignal): Promise<User> {
  let raw: RawBackendUser;
  try {
    raw = await apiFetch<RawBackendUser>("/auth/me", { signal });
  } catch {
    raw = await apiFetch<RawBackendUser>("/users/me", { signal });
  }
  return normalizeUser(raw);
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout failure if network is down or already unauthenticated
  }
}

export async function saveOwnerProfile(payload: OwnerProfile): Promise<SaveOwnerProfileResponse> {
  try {
    await apiFetch<unknown>("/profile", {
      method: "PATCH",
      body: {
        full_name: payload.organizationName || undefined,
      },
    });
    return {
      profile: payload,
      onboardingCompleted: true,
    };
  } catch {
    return apiFetch<SaveOwnerProfileResponse>("/users/me/owner-profile", {
      method: "PUT",
      body: payload,
    });
  }
}
