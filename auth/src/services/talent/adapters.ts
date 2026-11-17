import type {
  FreelancerProfile,
  FreelancerProfilePayload,
  SaveFreelancerProfileResponse,
} from "./types";

export interface BackendFreelancerProfileRequest {
  headline: string;
  experience: string;
  githubUsername?: string;
  portfolioUrl?: string;
  bio: string;
  supportedStacks: string[];
  skills: string[];
  debuggingSpecialties: string[];
  availability: string;
  minBudget: number;
  acceptsIsolatedWorkspace: true;
  acceptsTestGate: true;
}

export interface BackendPatchFreelancersMeRequest {
  bio?: string;
  skills?: string[];
  experience_years?: number;
  availability?: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
}

export interface BackendSaveFreelancerResponse {
  profile?: Partial<FreelancerProfilePayload> | Record<string, unknown>;
  onboardingCompleted?: boolean;
  onboarding_completed?: boolean;
}

/**
 * Pure function: Maps experience string (e.g. "3-5 years", "2") to integer years.
 */
export function parseExperienceYears(exp: string): number {
  const match = exp.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Pure function: Maps frontend availability string to backend AvailabilityStatus enum.
 */
export function mapAvailabilityToBackend(avail: string): "AVAILABLE" | "BUSY" | "UNAVAILABLE" {
  const lower = avail.toLowerCase().trim();
  if (lower.includes("busy")) return "BUSY";
  if (lower.includes("unavail") || lower.includes("off")) return "UNAVAILABLE";
  return "AVAILABLE";
}

/**
 * Pure function: Maps internal FreelancerProfilePayload to backend PUT /talent/profiles/me request.
 */
export function adaptFreelancerProfileRequest(
  payload: FreelancerProfilePayload
): BackendFreelancerProfileRequest {
  return {
    ...payload,
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    supportedStacks: Array.isArray(payload.supportedStacks) ? payload.supportedStacks : [],
    debuggingSpecialties: Array.isArray(payload.debuggingSpecialties) ? payload.debuggingSpecialties : [],
  };
}

/**
 * Pure function: Maps internal FreelancerProfilePayload to backend PATCH /freelancers/me request.
 */
export function adaptPatchFreelancersMeRequest(
  payload: FreelancerProfilePayload
): BackendPatchFreelancersMeRequest {
  return {
    bio: payload.bio,
    skills: payload.skills,
    experience_years: parseExperienceYears(payload.experience),
    availability: mapAvailabilityToBackend(payload.availability),
  };
}

/**
 * Pure function: Maps backend response to internal SaveFreelancerProfileResponse.
 */
export function adaptSaveFreelancerProfileResponse(
  raw: BackendSaveFreelancerResponse,
  fallbackPayload: FreelancerProfilePayload
): SaveFreelancerProfileResponse {
  const profileData = (raw?.profile as Partial<FreelancerProfilePayload>) || {};
  const merged: FreelancerProfile = {
    ...fallbackPayload,
    ...profileData,
    githubVerified: Boolean(fallbackPayload.githubUsername || (profileData as any).githubVerified),
    rating: null,
  };

  return {
    profile: merged,
    onboardingCompleted: true,
  };
}
