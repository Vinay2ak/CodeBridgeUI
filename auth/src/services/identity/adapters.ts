import type {
  AuthResponse,
  OwnerProfile,
  RefreshResponse,
  SaveOwnerProfileResponse,
  User,
} from "./types";

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: "owner" | "freelancer";
}

export interface BackendRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: "OWNER" | "FREELANCER";
}

export interface BackendUserResponse {
  id: string;
  full_name?: string;
  displayName?: string;
  email: string;
  role: string;
  is_active?: boolean;
  is_verified?: boolean;
  status?: string;
  onboardingCompleted?: boolean;
  onboarding_completed?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface BackendTokenPairResponse {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  token_type?: string;
  expires_in?: number;
  expiresIn?: number;
  refresh_expires_in?: number;
  user?: BackendUserResponse;
}

export interface BackendSaveOwnerProfileResponse {
  profile?: OwnerProfile | Record<string, unknown>;
  onboardingCompleted?: boolean;
  onboarding_completed?: boolean;
}

/**
 * Pure function: Maps internal RegisterPayload to the contract's backend registration request.
 */
export function adaptRegisterRequest(payload: RegisterPayload): BackendRegisterRequest {
  return {
    email: payload.email.trim(),
    password: payload.password,
    full_name: payload.displayName.trim(),
    role: payload.role === "freelancer" ? "FREELANCER" : "OWNER",
  };
}

/**
 * Pure function: Maps backend User JSON to the app's internal User type.
 */
export function adaptUserResponse(raw: BackendUserResponse): User {
  const roleRaw = (raw.role || "owner").toUpperCase();
  const role: "owner" | "freelancer" | "admin" =
    roleRaw === "FREELANCER"
      ? "freelancer"
      : roleRaw === "ADMIN"
        ? "admin"
        : "owner";

  const isSuspended =
    raw.is_active === false || raw.status === "suspended";

  return {
    id: String(raw.id),
    email: raw.email,
    displayName: raw.displayName || raw.full_name || raw.email.split("@")[0] || "User",
    role,
    status: isSuspended ? "suspended" : "active",
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    onboardingCompleted:
      raw.onboardingCompleted ?? raw.onboarding_completed ?? true,
  };
}

/**
 * Pure function: Maps backend TokenPairResponse (from login/register) to AuthResponse.
 */
export function adaptAuthResponse(
  raw: BackendTokenPairResponse,
  fallbackUser?: User
): AuthResponse {
  const rawUser = raw.user || (raw as unknown as BackendUserResponse);
  const user = rawUser && rawUser.id ? adaptUserResponse(rawUser) : fallbackUser!;

  return {
    user,
    accessToken: raw.accessToken || raw.access_token || "",
    refreshToken: raw.refreshToken || raw.refresh_token,
    expiresIn: raw.expiresIn ?? raw.expires_in ?? 900,
  };
}

/**
 * Pure function: Maps backend TokenPairResponse (from refresh) to RefreshResponse.
 */
export function adaptRefreshResponse(raw: BackendTokenPairResponse): RefreshResponse {
  return {
    accessToken: raw.accessToken || raw.access_token || "",
    refreshToken: raw.refreshToken || raw.refresh_token,
    expiresIn: raw.expiresIn ?? raw.expires_in ?? 900,
  };
}

/**
 * Pure function: Maps internal OwnerProfile to backend save request.
 */
export function adaptSaveOwnerProfileRequest(payload: OwnerProfile): Record<string, unknown> {
  return {
    ...payload,
    organizationName: payload.organizationName,
    ownerType: payload.ownerType,
    primaryStack: payload.primaryStack,
    defaultBudgetRange: payload.defaultBudgetRange,
    preferredVerificationMode: payload.preferredVerificationMode,
  };
}

/**
 * Pure function: Maps backend save response to SaveOwnerProfileResponse.
 */
export function adaptSaveOwnerProfileResponse(
  raw: BackendSaveOwnerProfileResponse,
  sentProfile: OwnerProfile
): SaveOwnerProfileResponse {
  const profile = (raw.profile as OwnerProfile) || sentProfile;
  return {
    profile,
    onboardingCompleted: true,
  };
}
