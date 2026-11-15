import { http, HttpResponse } from "msw";
import { accountSchema, fullOwnerSchema } from "../../features/onboarding/schemas";
import { writeMockCookie, readMockCookie } from "../cookie";
import { makeFakeJwt, makeCorrelationId } from "../fakeJwt";
import { emitMockEvent } from "../../lib/events";
import { consumeForcedFieldError } from "../state";

// Service down flag — toggled by window.__cbMock
let identityDown = false;
export function setIdentityDown(val: boolean): void { identityDown = val; }

const KNOWN_EMAILS = new Set([
  "owner@demo.dev", "freelancer@demo.dev", "admin@demo.dev",
  "suspended@demo.dev", "newowner@demo.dev", "newfreelancer@demo.dev",
  "taken@demo.dev",
]);

const sessionRegistered = new Set<string>();
const ownerProfiles = new Map<string, Record<string, unknown>>();

function corsId(correlationId: string) {
  return { "X-Correlation-Id": correlationId };
}

function errorBody(code: string, detail: string, correlationId: string, status: number, errors?: {field:string;message:string}[]) {
  return HttpResponse.json(
    { type: "error", title: code, status, code, detail, correlationId, ...(errors ? {errors} : {}) },
    { status, headers: corsId(correlationId) }
  );
}

export const identityHandlers = [
  // POST /api/v1/auth/register
  http.post("*/api/v1/auth/register", async ({ request }) => {
    const correlationId = makeCorrelationId();
    if (identityDown) {
      return errorBody("SERVICE_UNAVAILABLE", "Identity service is unavailable", correlationId, 503);
    }

    const body = await request.json() as Record<string, unknown>;
    const email = (body.email as string) ?? "";

    // Rate limit
    if (email === "limited@demo.dev") {
      return HttpResponse.json(
        { type: "error", code: "RATE_LIMITED", title: "Rate limited", status: 429, detail: "Too many requests", correlationId },
        { status: 429, headers: { ...corsId(correlationId), "Retry-After": "10" } }
      );
    }

    // Service down
    if (email === "down@demo.dev") {
      return errorBody("SERVICE_UNAVAILABLE", "Identity service is unavailable", correlationId, 503);
    }

    // Validate with accountSchema
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: String(e.path[0] ?? ""),
        message: e.message,
      }));
      return errorBody("VALIDATION_FAILED", "Validation failed", correlationId, 422, errors);
    }

    // Email taken
    const lc = email.toLowerCase();
    if (KNOWN_EMAILS.has(lc) || sessionRegistered.has(lc)) {
      return errorBody("EMAIL_TAKEN", "An account with this email already exists", correlationId, 409);
    }

    // Create user
    sessionRegistered.add(lc);
    const userId = crypto.randomUUID();
    const role = parsed.data.role;
    const displayName = parsed.data.displayName;
    const now = new Date().toISOString();

    const user = {
      id: userId,
      email: parsed.data.email,
      displayName,
      role,
      status: "active" as const,
      createdAt: now,
      onboardingCompleted: false,
    };

    writeMockCookie({ ...user });
    const accessToken = makeFakeJwt({ sub: userId, role, email: parsed.data.email });

    emitMockEvent({
      id: crypto.randomUUID(),
      type: "user.registered",
      occurredAt: now,
      source: "identity",
      correlationId,
      data: { userId, role, displayName },
    });

    return HttpResponse.json(
      { user, accessToken, expiresIn: 900 },
      { status: 201, headers: corsId(correlationId) }
    );
  }),

  // POST /api/v1/auth/login
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const correlationId = makeCorrelationId();
    if (identityDown) return errorBody("SERVICE_UNAVAILABLE", "Identity service unavailable", correlationId, 503);

    const body = await request.json() as Record<string, unknown>;
    const email = (body.email as string)?.toLowerCase() ?? "";
    const password = body.password as string;

    if (email === "suspended@demo.dev") {
      return errorBody("ACCOUNT_SUSPENDED", "Your account has been suspended", correlationId, 403);
    }
    if (email === "down@demo.dev") {
      return errorBody("SERVICE_UNAVAILABLE", "Service unavailable", correlationId, 503);
    }
    if (email === "limited@demo.dev") {
      return HttpResponse.json(
        { code: "RATE_LIMITED", title: "Rate limited", status: 429, correlationId },
        { status: 429, headers: { ...corsId(correlationId), "Retry-After": "10" } }
      );
    }

    // For demo accounts, any password works. For unknown email -> INVALID_CREDENTIALS.
    const demoRoles: Record<string, "owner" | "freelancer" | "admin"> = {
      "owner@demo.dev": "owner",
      "freelancer@demo.dev": "freelancer",
      "admin@demo.dev": "admin",
      "newowner@demo.dev": "owner",
      "newfreelancer@demo.dev": "freelancer",
    };

    const role = demoRoles[email];
    if (!role && !sessionRegistered.has(email)) {
      if (!password) return errorBody("INVALID_CREDENTIALS", "Invalid credentials", correlationId, 401);
      return errorBody("INVALID_CREDENTIALS", "Invalid credentials", correlationId, 401);
    }

    const onboardingCompleted = email === "newowner@demo.dev" || email === "newfreelancer@demo.dev" ? false : true;
    const userId = crypto.randomUUID();
    const displayName = email.split("@")[0] ?? "User";

    const user = {
      id: userId,
      email,
      displayName,
      role: role ?? "owner",
      status: "active" as const,
      createdAt: new Date().toISOString(),
      onboardingCompleted,
    };

    writeMockCookie({ ...user });
    const accessToken = makeFakeJwt({ sub: userId, role: user.role, email });

    return HttpResponse.json(
      { user, accessToken, expiresIn: 900 },
      { status: 200, headers: corsId(correlationId) }
    );
  }),

  // POST /api/v1/auth/refresh
  http.post("*/api/v1/auth/refresh", () => {
    const correlationId = makeCorrelationId();
    if (identityDown) return errorBody("SERVICE_UNAVAILABLE", "Service unavailable", correlationId, 503);

    const cookie = readMockCookie();
    if (!cookie) {
      return errorBody("REFRESH_INVALID", "No refresh token", correlationId, 401);
    }

    const accessToken = makeFakeJwt({ sub: cookie.id, role: cookie.role, email: cookie.email });
    return HttpResponse.json(
      { accessToken, expiresIn: 900 },
      { status: 200, headers: corsId(correlationId) }
    );
  }),

  // GET /api/v1/users/me
  http.get("*/api/v1/users/me", ({ request }) => {
    const correlationId = makeCorrelationId();
    if (identityDown) return errorBody("SERVICE_UNAVAILABLE", "Service unavailable", correlationId, 503);

    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return errorBody("UNAUTHENTICATED", "No token", correlationId, 401);
    }

    const cookie = readMockCookie();
    if (!cookie) return errorBody("UNAUTHENTICATED", "Session expired", correlationId, 401);

    return HttpResponse.json(
      {
        id: cookie.id,
        email: cookie.email,
        displayName: cookie.displayName,
        role: cookie.role,
        status: cookie.status,
        createdAt: cookie.createdAt,
        onboardingCompleted: cookie.onboardingCompleted,
      },
      { status: 200, headers: corsId(correlationId) }
    );
  }),

  // POST /api/v1/auth/logout
  http.post("*/api/v1/auth/logout", () => {
    const correlationId = makeCorrelationId();
    document.cookie = "mock_rt=; path=/; max-age=0";
    return new HttpResponse(null, { status: 204, headers: corsId(correlationId) });
  }),

  // PUT /api/v1/users/me/owner-profile
  http.put("*/api/v1/users/me/owner-profile", async ({ request }) => {
    const correlationId = makeCorrelationId();
    if (identityDown) return errorBody("SERVICE_UNAVAILABLE", "Service unavailable", correlationId, 503);

    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return errorBody("UNAUTHENTICATED", "No token", correlationId, 401);

    const cookie = readMockCookie();
    if (!cookie) return errorBody("UNAUTHENTICATED", "Session expired", correlationId, 401);
    if (cookie.role !== "owner") return errorBody("FORBIDDEN", "Owner only", correlationId, 403);

    const body = await request.json() as Record<string, unknown>;

    // Check forced field error
    const forcedField = consumeForcedFieldError();
    if (forcedField) {
      return errorBody("VALIDATION_FAILED", "Validation failed", correlationId, 422, [{ field: forcedField, message: "Forced error" }]);
    }

    const parsed = fullOwnerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ field: String(e.path[0] ?? ""), message: e.message }));
      return errorBody("VALIDATION_FAILED", "Validation failed", correlationId, 422, errors);
    }

    // Store profile, flip onboardingCompleted
    ownerProfiles.set(cookie.id, parsed.data as Record<string, unknown>);
    writeMockCookie({ ...cookie, onboardingCompleted: true });

    emitMockEvent({
      id: crypto.randomUUID(),
      type: "owner.profile_completed",
      occurredAt: new Date().toISOString(),
      source: "identity",
      correlationId,
      data: { userId: cookie.id, ownerType: parsed.data.ownerType },
    });

    return HttpResponse.json(
      { profile: parsed.data, onboardingCompleted: true },
      { status: 200, headers: corsId(correlationId) }
    );
  }),
];
