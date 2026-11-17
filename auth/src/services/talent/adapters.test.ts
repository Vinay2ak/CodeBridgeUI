import { describe, it, expect } from "vitest";
import {
  adaptFreelancerProfileRequest,
  adaptPatchFreelancersMeRequest,
  adaptSaveFreelancerProfileResponse,
  mapAvailabilityToBackend,
  parseExperienceYears,
} from "./adapters";
import type { FreelancerProfilePayload } from "./types";

describe("Talent Service Adapters", () => {
  // Fixture from contract section 5.1 & section 8
  const sampleFreelancerPayload: FreelancerProfilePayload = {
    headline: "Senior Full-Stack Engineer",
    experience: "5+ years",
    githubUsername: "alexmercer",
    portfolioUrl: "https://alexmercer.dev",
    bio: "Passionate about building scalable distributed systems.",
    supportedStacks: ["Node.js", "React", "Python"],
    skills: ["FastAPI", "TypeScript", "PostgreSQL"],
    debuggingSpecialties: ["Memory Leaks", "Concurrency Issues"],
    availability: "full_time",
    minBudget: 5000,
    acceptsIsolatedWorkspace: true,
    acceptsTestGate: true,
  };

  it("parseExperienceYears extracts numeric years from string", () => {
    expect(parseExperienceYears("5+ years")).toBe(5);
    expect(parseExperienceYears("3 years")).toBe(3);
    expect(parseExperienceYears("None")).toBe(0);
  });

  it("mapAvailabilityToBackend converts string to AvailabilityStatus enum", () => {
    expect(mapAvailabilityToBackend("full_time")).toBe("AVAILABLE");
    expect(mapAvailabilityToBackend("busy")).toBe("BUSY");
    expect(mapAvailabilityToBackend("unavailable")).toBe("UNAVAILABLE");
  });

  it("adaptFreelancerProfileRequest returns properly formatted payload", () => {
    const req = adaptFreelancerProfileRequest(sampleFreelancerPayload);
    expect(req.headline).toBe("Senior Full-Stack Engineer");
    expect(req.skills).toEqual(["FastAPI", "TypeScript", "PostgreSQL"]);
  });

  it("adaptPatchFreelancersMeRequest maps SQL columns with uppercase enum and integer years", () => {
    const patchReq = adaptPatchFreelancersMeRequest(sampleFreelancerPayload);
    expect(patchReq).toEqual({
      bio: "Passionate about building scalable distributed systems.",
      skills: ["FastAPI", "TypeScript", "PostgreSQL"],
      experience_years: 5,
      availability: "AVAILABLE",
    });
  });

  it("adaptSaveFreelancerProfileResponse builds internal SaveFreelancerProfileResponse", () => {
    // Contract fixture for PUT /api/v1/talent/profiles/me
    const backendResponseFixture = {
      profile: {
        headline: "Senior Full-Stack Engineer",
        skills: ["FastAPI", "TypeScript", "PostgreSQL"],
      },
      onboardingCompleted: true,
    };

    const res = adaptSaveFreelancerProfileResponse(
      backendResponseFixture,
      sampleFreelancerPayload
    );

    expect(res.onboardingCompleted).toBe(true);
    expect(res.profile.githubVerified).toBe(true);
    expect(res.profile.headline).toBe("Senior Full-Stack Engineer");
    expect(res.profile.rating).toBeNull();
  });
});
