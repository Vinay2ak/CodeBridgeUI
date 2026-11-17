import { apiFetch } from "../../lib/http";
import {
  adaptFreelancerProfileRequest,
  adaptPatchFreelancersMeRequest,
  adaptSaveFreelancerProfileResponse,
  type BackendSaveFreelancerResponse,
} from "./adapters";
import type { FreelancerProfilePayload, SaveFreelancerProfileResponse } from "./types";

/**
 * Save freelancer onboarding profile.
 * Primary Contract Path: PUT /api/v1/talent/profiles/me
 * Downstream SQL Path: PATCH /api/v1/freelancers/me
 * Contracts: Section 5.1 & Section 8
 */
export async function saveFreelancerProfile(
  payload: FreelancerProfilePayload
): Promise<SaveFreelancerProfileResponse> {
  const reqBody = adaptFreelancerProfileRequest(payload);

  try {
    const raw = await apiFetch<BackendSaveFreelancerResponse>(
      "/api/v1/talent/profiles/me",
      {
        method: "PUT",
        body: reqBody,
      }
    );
    return adaptSaveFreelancerProfileResponse(raw, payload);
  } catch (err: unknown) {
    // If client error (validation, forbidden, unauthenticated), throw directly
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number" &&
      (err as { status: number }).status < 500
    ) {
      throw err;
    }

    // Fallback: update SQL fields on /api/v1/freelancers/me
    try {
      const patchReq = adaptPatchFreelancersMeRequest(payload);
      await apiFetch<unknown>("/api/v1/freelancers/me", {
        method: "PATCH",
        body: patchReq,
      });
    } catch {
      // Secondary fallback: update display headline on /api/v1/profile
      await apiFetch<unknown>("/api/v1/profile", {
        method: "PATCH",
        body: {
          full_name: payload.headline || undefined,
        },
      });
    }

    return adaptSaveFreelancerProfileResponse({}, payload);
  }
}
