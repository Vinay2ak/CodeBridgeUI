import { describe, it, expect } from "vitest";
import { adaptUser, adaptRefreshResponse, adaptRole } from "./adapters";

describe("identity adapters", () => {
  it("adapts backend user fixture from contract section 3.6 (GET /api/v1/users/me)", () => {
    // Exact fixture from contract line 266-280
    const backendUser = {
      id: "c1f7b8c2-2849-4177-bb89-7cf1f7823f66",
      full_name: "Alex Mercer",
      displayName: "Alex Mercer",
      email: "developer@example.com",
      role: "FREELANCER",
      is_active: true,
      is_verified: false,
      status: "active",
      onboardingCompleted: true,
      created_at: "2026-11-17T12:00:00Z",
      updated_at: "2026-11-17T12:00:00Z",
    };

    const user = adaptUser(backendUser);

    expect(user.id).toBe("c1f7b8c2-2849-4177-bb89-7cf1f7823f66");
    expect(user.displayName).toBe("Alex Mercer");
    expect(user.email).toBe("developer@example.com");
    expect(user.role).toBe("freelancer");
    expect(user.status).toBe("active");
    expect(user.createdAt).toBe("2026-11-17T12:00:00Z");
    expect(user.onboardingCompleted).toBe(true);
  });

  it("adapts backend refresh response from contract section 3.3 (POST /api/v1/auth/refresh)", () => {
    // Exact fixture from contract line 190-213
    const backendRefresh = {
      access_token: "jwt_token_sample_123",
      accessToken: "jwt_token_sample_123",
      refresh_token: "rt_token_sample_456",
      token_type: "bearer",
      expires_in: 900,
      expiresIn: 900,
      user: {
        id: "c1f7b8c2-2849-4177-bb89-7cf1f7823f66",
        role: "FREELANCER",
      },
    };

    const res = adaptRefreshResponse(backendRefresh);
    expect(res.accessToken).toBe("jwt_token_sample_123");
    expect(res.expiresIn).toBe(900);
  });

  it("maps roles correctly", () => {
    expect(adaptRole("FREELANCER")).toBe("freelancer");
    expect(adaptRole("OWNER")).toBe("owner");
    expect(adaptRole("ADMIN")).toBe("admin");
    expect(adaptRole("unknown")).toBe("freelancer");
  });
});
