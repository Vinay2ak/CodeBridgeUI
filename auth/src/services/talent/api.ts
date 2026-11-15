import { apiFetch } from "../../lib/http";
import type { FreelancerProfilePayload, SaveFreelancerProfileResponse } from "./types";

export async function saveFreelancerProfile(
  payload: FreelancerProfilePayload
): Promise<SaveFreelancerProfileResponse> {
  try {
    await apiFetch<unknown>("/profile", {
      method: "PATCH",
      body: {
        full_name: payload.headline || undefined,
      },
    });
    return {
      profile: {
        ...payload,
        githubVerified: Boolean(payload.githubUsername),
        rating: null,
      },
      onboardingCompleted: true,
    };
  } catch {
    return apiFetch<SaveFreelancerProfileResponse>("/talent/profiles/me", {
      method: "PUT",
      body: payload,
    });
  }
}
