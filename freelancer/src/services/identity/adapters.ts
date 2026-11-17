import type { User } from "../../session/session";
import type { RefreshResponse } from "./types";

/**
 * Maps backend user roles ("FREELANCER", "OWNER", "ADMIN") to frontend enum ("freelancer", "owner", "admin")
 */
export function adaptRole(role?: string): "owner" | "freelancer" | "admin" {
  const normalized = (role || "").toUpperCase();
  if (normalized === "OWNER") return "owner";
  if (normalized === "ADMIN") return "admin";
  return "freelancer";
}

/**
 * Maps backend user status ("active", "suspended", is_active) to internal status
 */
export function adaptStatus(raw: any): "active" | "suspended" {
  if (raw?.status === "suspended" || raw?.is_active === false) {
    return "suspended";
  }
  return "active";
}

/**
 * Adapts backend user payload (from GET /api/v1/users/me or login/refresh token response)
 * into internal User type
 */
export function adaptUser(raw: any): User {
  if (!raw || typeof raw !== "object") {
    return {
      id: "anonymous",
      email: "",
      displayName: "Freelancer",
      role: "freelancer",
      status: "active",
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
    };
  }

  const role = adaptRole(raw.role);
  const status = adaptStatus(raw);
  const displayName =
    raw.displayName ||
    raw.full_name ||
    raw.name ||
    (raw.email ? raw.email.split("@")[0] : "Freelancer");

  const createdAt = raw.created_at || raw.createdAt || new Date().toISOString();
  const onboardingCompleted = raw.onboardingCompleted ?? raw.onboarding_completed ?? true;

  return {
    id: String(raw.id || "anonymous"),
    email: String(raw.email || ""),
    displayName: String(displayName),
    role,
    status,
    createdAt: String(createdAt),
    onboardingCompleted: Boolean(onboardingCompleted),
  };
}

/**
 * Adapts backend token refresh response (POST /api/v1/auth/refresh)
 */
export function adaptRefreshResponse(raw: any): RefreshResponse {
  const accessToken = raw?.accessToken || raw?.access_token || "";
  const expiresIn = raw?.expiresIn ?? raw?.expires_in ?? 900;

  return {
    accessToken: String(accessToken),
    expiresIn: Number(expiresIn),
  };
}
