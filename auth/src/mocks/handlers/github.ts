import { http, HttpResponse } from "msw";
import { readMockCookie } from "../cookie";
import { makeCorrelationId } from "../fakeJwt";
import { githubLinks, isGithubDown } from "../state";

function corsId(id: string) { return { "X-Correlation-Id": id }; }
function errorBody(code: string, detail: string, correlationId: string, status: number) {
  return HttpResponse.json(
    { type: "error", code, detail, correlationId, status },
    { status, headers: corsId(correlationId) }
  );
}

export const githubHandlers = [
  http.get("*/api/v1/github/link/me", ({ request }) => {
    const correlationId = makeCorrelationId();
    if (isGithubDown()) return errorBody("SERVICE_UNAVAILABLE", "GitHub service unavailable", correlationId, 503);

    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return errorBody("UNAUTHENTICATED", "No token", correlationId, 401);

    const cookie = readMockCookie();
    if (!cookie) return errorBody("UNAUTHENTICATED", "Session expired", correlationId, 401);

    const username = githubLinks.get(cookie.id);
    return HttpResponse.json(
      { connected: !!username, ...(username ? { githubUsername: username } : {}) },
      { status: 200, headers: corsId(correlationId) }
    );
  }),

  http.post("*/api/v1/github/link/mock", async ({ request }) => {
    const correlationId = makeCorrelationId();
    if (isGithubDown()) return errorBody("SERVICE_UNAVAILABLE", "GitHub service unavailable", correlationId, 503);

    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return errorBody("UNAUTHENTICATED", "No token", correlationId, 401);

    const cookie = readMockCookie();
    if (!cookie) return errorBody("UNAUTHENTICATED", "Session expired", correlationId, 401);

    const body = await request.json() as Record<string, unknown>;
    const githubUsername = (body.githubUsername as string) ?? "";
    githubLinks.set(cookie.id, githubUsername);

    return HttpResponse.json(
      { connected: true, githubUsername },
      { status: 200, headers: corsId(correlationId) }
    );
  }),
];
