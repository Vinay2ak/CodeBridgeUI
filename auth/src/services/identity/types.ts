export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "freelancer" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface OwnerProfile {
  ownerType: string;
  organizationName: string;
  roleTitle: string;
  timezone: string;
  primaryStack: string[];
  typicalBlocker: string;
  defaultBudgetRange: string;
  preferredVerificationMode: string;
}

export interface SaveOwnerProfileResponse {
  profile: OwnerProfile;
  onboardingCompleted: true;
}
