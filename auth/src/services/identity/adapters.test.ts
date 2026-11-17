import { describe, it, expect } from "vitest";
import {
  adaptRegisterRequest,
  adaptUserResponse,
  adaptAuthResponse,
  adaptRefreshResponse,
  adaptSaveOwnerProfileRequest,
  adaptSaveOwnerProfileResponse,
} from "./adapters";
import type { OwnerProfile } from "./types";

describe("Identity Service Adapters", () => {
  // Fixture from contract section 3.2
  const contractUserFixture = {
    id: "c1f7b8c2-2849-4177-bb89-7cf1f7823f66",
    full_name: "Alex Mercer",
    displayName: "Alex Mercer",
    email: "developer@example.com",
    role: "FREELANCER",
    is_active: true,
    is_verified: false,
    status: "active",
    onboardingCompleted: true,
    onboarding_completed: true,
    created_at: "2026-11-17T12:00:00Z",
    updated_at: "2026-11-17T12:00:00Z",
  };

  // Fixture from contract section 3.3
  const contractTokenPairFixture = {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.payload.sig",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.payload.sig",
    refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.sig",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.sig",
    token_type: "bearer",
    expires_in: 900,
    expiresIn: 900,
    refresh_expires_in: 604800,
    user: contractUserFixture,
  };

  it("adaptRegisterRequest maps internal request to backend request casing and role", () => {
    const payload = {
      email: "developer@example.com",
      password: "StrongPassword123!",
      displayName: "Alex Mercer",
      role: "freelancer" as const,
    };

    const adapted = adaptRegisterRequest(payload);
    expect(adapted).toEqual({
      email: "developer@example.com",
      password: "StrongPassword123!",
      full_name: "Alex Mercer",
      role: "FREELANCER",
    });
  });

  it("adaptUserResponse maps contract user to internal User type", () => {
    const user = adaptUserResponse(contractUserFixture);

    expect(user).toEqual({
      id: "c1f7b8c2-2849-4177-bb89-7cf1f7823f66",
      email: "developer@example.com",
      displayName: "Alex Mercer",
      role: "freelancer",
      status: "active",
      createdAt: "2026-11-17T12:00:00Z",
      onboardingCompleted: true,
    });
  });

  it("adaptAuthResponse maps contract token pair to internal AuthResponse", () => {
    const auth = adaptAuthResponse(contractTokenPairFixture);

    expect(auth.accessToken).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.payload.sig");
    expect(auth.refreshToken).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.sig");
    expect(auth.expiresIn).toBe(900);
    expect(auth.user.role).toBe("freelancer");
    expect(auth.user.email).toBe("developer@example.com");
  });

  it("adaptRefreshResponse maps contract TokenPairResponse to RefreshResponse", () => {
    const refresh = adaptRefreshResponse(contractTokenPairFixture);

    expect(refresh.accessToken).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.payload.sig");
    expect(refresh.refreshToken).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.sig");
    expect(refresh.expiresIn).toBe(900);
  });

  it("adaptSaveOwnerProfile maps profile and response", () => {
    const ownerProfile: OwnerProfile = {
      ownerType: "startup",
      organizationName: "Acme Corp",
      roleTitle: "CTO",
      timezone: "America/New_York",
      primaryStack: ["TypeScript", "React"],
      typicalBlocker: "Tight deadlines",
      defaultBudgetRange: "$5k-$10k",
      preferredVerificationMode: "test_suite",
    };

    const req = adaptSaveOwnerProfileRequest(ownerProfile);
    expect(req.organizationName).toBe("Acme Corp");

    const res = adaptSaveOwnerProfileResponse(
      { profile: ownerProfile, onboardingCompleted: true },
      ownerProfile
    );
    expect(res.onboardingCompleted).toBe(true);
    expect(res.profile.organizationName).toBe("Acme Corp");
  });
});
