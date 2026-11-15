import { http, HttpResponse } from "msw";
import { fullFreelancerSchema } from "../../features/onboarding/schemas";
import { readMockCookie, writeMockCookie } from "../cookie";
import { makeCorrelationId } from "../fakeJwt";
import { emitMockEvent } from "../../lib/events";
import { isTalentDown, consumeForcedFieldError, githubLinks, setFreelancerProfile } from "../state";

function corsId(id: string) { return { "X-Correlation-Id": id }; }

function errorBody(code: string, detail: string, correlationId: string, status: number, errors?: {field:string;message:string}[]) {
  return HttpResponse.json(
    { type: "error", title: code, status, code, detail, correlationId, ...(errors ? {errors} : {}) },
    { status, headers: corsId(correlationId) }
  );
}

export const talentHandlers = [
  http.put("*/api/v1/talent/profiles/me", async ({ request }) => {
    const correlationId = makeCorrelationId();
    if (isTalentDown()) return errorBody("SERVICE_UNAVAILABLE", "Talent service unavailable", correlationId, 503);

    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return errorBody("UNAUTHENTICATED", "No token", correlationId, 401);

    const cookie = readMockCookie();
    if (!cookie) return errorBody("UNAUTHENTICATED", "Session expired", correlationId, 401);
    if (cookie.role !== "freelancer") return errorBody("FORBIDDEN", "Freelancer only", correlationId, 403);

    const forcedField = consumeForcedFieldError();
    if (forcedField) {
      return errorBody("VALIDATION_FAILED", "Validation failed", correlationId, 422, [{ field: forcedField, message: "Forced error" }]);
    }

    const body = await request.json() as Record<string, unknown>;
    const parsed = fullFreelancerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ field: String(e.path[0] ?? ""), message: e.message }));
      return errorBody("VALIDATION_FAILED", "Validation failed", correlationId, 422, errors);
    }

    const githubUsername = parsed.data.githubUsername;
    const githubVerified = !!(githubUsername && githubLinks.get(cookie.id) === githubUsername);

    const profile = { ...parsed.data, githubVerified, rating: null };
    setFreelancerProfile(cookie.id, profile as Record<string, unknown>);
    writeMockCookie({ ...cookie, onboardingCompleted: true });

    emitMockEvent({
      id: crypto.randomUUID(),
      type: "freelancer.profile_completed",
      occurredAt: new Date().toISOString(),
      source: "talent",
      correlationId,
      data: {
        userId: cookie.id,
        experience: parsed.data.experience,
        skillCount: parsed.data.skills.length,
        availability: parsed.data.availability,
      },
    });

    return HttpResponse.json(
      { profile, onboardingCompleted: true },
      { status: 200, headers: corsId(correlationId) }
    );
  }),
];
