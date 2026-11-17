import { http, HttpResponse, delay, HttpHandler } from "msw";
import { env } from "../lib/env";
import { MOCK_TASKS, MOCK_TASK_SUMMARIES, MOCK_ESCROWS } from "./data/tasks";
import { MOCK_AI_CONTEXTS } from "./data/ai";
import {
  getWorkspace,
  startMockWorkspace,
  stopMockWorkspace,
  resetMockWorkspace,
  getMockFiles,
  getMockFileContent,
  saveMockFileContent,
  startMockTestRun,
  getMockRun,
  submitMockSolution,
  getSubmissionState,
} from "./simulator";

// Down status flags for services
export const serviceDownState: Record<
  "workspace" | "submission" | "ai" | "payment" | "notification" | "project" | "profile" | "identity",
  boolean
> = {
  workspace: false,
  submission: false,
  ai: false,
  payment: false,
  notification: false,
  project: false,
  profile: false,
  identity: false,
};

export let isSuspendedMock = false;
export let forceExpireToken = false;

export function setMockSuspended(suspended: boolean) {
  isSuspendedMock = suspended;
}

export function setForceExpireToken(expire: boolean) {
  forceExpireToken = expire;
}

function generateUuid(): string {
  return "corr_" + Math.random().toString(36).substring(2, 11);
}

function parseMockRtCookie(): any | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)mock_rt=([^;]*)/);
  if (!match) return null;
  try {
    const jsonStr = atob(decodeURIComponent(match[1]));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function writeMockRtCookie(user: any): void {
  if (typeof document === "undefined") return;
  const b64 = btoa(JSON.stringify(user));
  document.cookie = `mock_rt=${encodeURIComponent(b64)}; path=/; max-age=604800; SameSite=Lax`;
}

function clearMockRtCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "mock_rt=; path=/; max-age=0; SameSite=Lax";
}

function createFakeJwt(sub: string, role: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + env.mockTokenTtlSeconds;
  const payload = btoa(JSON.stringify({ sub, role, exp }));
  const signature = "fake_sig_" + Math.random().toString(36).substring(2);
  return `${header}.${payload}.${signature}`;
}

function verifyAuth(request: Request): {
  valid: boolean;
  status: number;
  code: string;
  detail: string;
} {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return {
      valid: false,
      status: 401,
      code: "UNAUTHENTICATED",
      detail: "Missing or malformed Authorization header",
    };
  }

  const token = auth.substring(7);
  if (!token || forceExpireToken) {
    return {
      valid: false,
      status: 401,
      code: "TOKEN_EXPIRED",
      detail: "Access token is invalid or expired",
    };
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("bad token");
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        valid: false,
        status: 401,
        code: "TOKEN_EXPIRED",
        detail: "Access token has expired",
      };
    }

    if (isSuspendedMock) {
      return {
        valid: false,
        status: 403,
        code: "ACCOUNT_SUSPENDED",
        detail: "Freelancer account is suspended",
      };
    }

    return { valid: true, status: 200, code: "", detail: "" };
  } catch {
    return {
      valid: false,
      status: 401,
      code: "TOKEN_INVALID",
      detail: "Malformed access token",
    };
  }
}

// ==================== IDENTITY HANDLERS ====================
export const identityHandlers: HttpHandler[] = [
  http.post("*/api/v1/auth/refresh", async () => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();
    const cookieUser = parseMockRtCookie();

    if (!cookieUser) {
      return HttpResponse.json(
        {
          code: "REFRESH_INVALID",
          detail: "Missing or invalid refresh token cookie",
          correlationId: corrId,
        },
        { status: 401, headers: { "X-Correlation-Id": corrId } }
      );
    }

    if (cookieUser.status === "suspended" || isSuspendedMock) {
      return HttpResponse.json(
        {
          code: "ACCOUNT_SUSPENDED",
          detail: "Freelancer account is suspended",
          correlationId: corrId,
        },
        { status: 403, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const token = createFakeJwt(cookieUser.id || "usr_ravi", cookieUser.role || "freelancer");
    return HttpResponse.json(
      {
        accessToken: token,
        expiresIn: env.mockTokenTtlSeconds,
      },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),

  http.post("*/api/v1/auth/logout", async () => {
    await delay(300);
    const corrId = generateUuid();
    clearMockRtCookie();
    return new HttpResponse(null, {
      status: 204,
      headers: { "X-Correlation-Id": corrId },
    });
  }),

  http.get("*/api/v1/users/me", async () => {
    await delay(300);
    const corrId = generateUuid();
    const cookieUser = parseMockRtCookie();

    if (!cookieUser) {
      return HttpResponse.json(
        {
          code: "UNAUTHENTICATED",
          detail: "No active session",
          correlationId: corrId,
        },
        { status: 401, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(
      {
        id: cookieUser.id || "usr_ravi",
        email: cookieUser.email || "ravi@codebridge.dev",
        displayName: cookieUser.displayName || "Ravi Freelancer",
        role: cookieUser.role || "freelancer",
        status: isSuspendedMock ? "suspended" : cookieUser.status || "active",
        createdAt: cookieUser.createdAt || "2026-01-15T10:00:00Z",
        onboardingCompleted: cookieUser.onboardingCompleted !== false,
      },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),
];

// ==================== WORKSPACE HANDLERS ====================
export const workspaceHandlers: HttpHandler[] = [
  http.get("*/api/v1/tasks/mine", async ({ request }) => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json({ items: MOCK_TASK_SUMMARIES }, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.get("*/api/v1/tasks/:id", async ({ params, request }) => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const task = MOCK_TASKS[params.id as string];
    if (!task) {
      return HttpResponse.json(
        { code: "NOT_FOUND", detail: "Task not found", correlationId: corrId },
        { status: 404, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(task, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.get("*/api/v1/workspaces/:taskId", async ({ params, request }) => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const ws = getWorkspace(params.taskId as string);
    return HttpResponse.json(ws, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.post("*/api/v1/workspaces/:taskId/start", async ({ params, request }) => {
    await delay(600);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    startMockWorkspace(params.taskId as string);
    return HttpResponse.json({ status: "running" }, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.post("*/api/v1/workspaces/:taskId/stop", async ({ params, request }) => {
    await delay(400);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    stopMockWorkspace(params.taskId as string);
    return HttpResponse.json({ status: "stopped" }, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.post("*/api/v1/workspaces/:taskId/reset", async ({ params, request }) => {
    await delay(800);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    resetMockWorkspace(params.taskId as string);
    return HttpResponse.json({ status: "running" }, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.get("*/api/v1/workspaces/:taskId/files", async ({ params, request }) => {
    await delay(Math.floor(Math.random() * 300) + 200);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const taskId = params.taskId as string;
    const files = getMockFiles(taskId);
    const ws = getWorkspace(taskId);

    return HttpResponse.json(
      {
        commit: ws.commit,
        items: files.map((f) => ({
          path: f.path,
          type: "file" as const,
          size: f.content.length,
        })),
      },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),

  http.get("*/api/v1/workspaces/:taskId/files/content", async ({ request, params }) => {
    await delay(Math.floor(Math.random() * 200) + 100);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const url = new URL(request.url);
    const filePath = url.searchParams.get("path") || "";
    const file = getMockFileContent(params.taskId as string, filePath);

    if (!file) {
      return HttpResponse.json(
        { code: "NOT_FOUND", detail: "File not found", correlationId: corrId },
        { status: 404, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(file, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.put("*/api/v1/workspaces/:taskId/files/content", async ({ request, params }) => {
    await delay(200);
    const corrId = generateUuid();

    if (serviceDownState.workspace) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Workspace service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const body = (await request.json()) as { path: string; content: string };
    saveMockFileContent(params.taskId as string, body.path, body.content);

    return HttpResponse.json(
      { savedAt: new Date().toISOString() },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),
];

// ==================== SUBMISSION HANDLERS ====================
export const submissionHandlers: HttpHandler[] = [
  http.post("*/api/v1/submissions/runs", async ({ request }) => {
    await delay(400);
    const corrId = generateUuid();

    if (serviceDownState.submission) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Submission service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { taskId?: string };
    const taskId = body.taskId || "t1";
    const runId = startMockTestRun(taskId);

    return HttpResponse.json({ runId }, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.get("*/api/v1/submissions/runs/:runId", async ({ params, request }) => {
    await delay(200);
    const corrId = generateUuid();

    if (serviceDownState.submission) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Submission service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const run = getMockRun(params.runId as string);
    if (!run) {
      return HttpResponse.json(
        { code: "NOT_FOUND", detail: "Run not found", correlationId: corrId },
        { status: 404, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(run, { headers: { "X-Correlation-Id": corrId } });
  }),

  http.post("*/api/v1/submissions", async ({ request }) => {
    await delay(600);
    const corrId = generateUuid();

    if (serviceDownState.submission) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Submission service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const body = (await request.json()) as { taskId: string; notes?: string };
    if (!body.taskId) {
      return HttpResponse.json(
        { code: "BAD_REQUEST", detail: "Missing taskId", correlationId: corrId },
        { status: 400, headers: { "X-Correlation-Id": corrId } }
      );
    }

    try {
      const submissionId = submitMockSolution(body.taskId, body.notes || "");
      return HttpResponse.json(
        { submissionId, status: "in_review" },
        { headers: { "X-Correlation-Id": corrId } }
      );
    } catch (err: any) {
      return HttpResponse.json(
        {
          code: "SUBMISSION_LOCKED",
          detail: err?.message || "All required tests must pass before submission",
          correlationId: corrId,
        },
        { status: 422, headers: { "X-Correlation-Id": corrId } }
      );
    }
  }),

  http.get("*/api/v1/submissions/current", async ({ request }) => {
    await delay(300);
    const corrId = generateUuid();

    if (serviceDownState.submission) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Submission service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId") || "t1";
    const subState = getSubmissionState(taskId);

    return HttpResponse.json(subState, { headers: { "X-Correlation-Id": corrId } });
  }),
];

// ==================== AI HANDLERS ====================
export const aiHandlers: HttpHandler[] = [
  http.get("*/api/v1/ai/context/:taskId", async ({ params, request }) => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();

    if (serviceDownState.ai) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "AI context service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const ctx = MOCK_AI_CONTEXTS[params.taskId as string];
    if (!ctx) {
      return HttpResponse.json(
        { code: "NOT_FOUND", detail: "Context not found", correlationId: corrId },
        { status: 404, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(ctx, { headers: { "X-Correlation-Id": corrId } });
  }),
];

// ==================== PAYMENT HANDLERS ====================
export const paymentHandlers: HttpHandler[] = [
  http.get("*/api/v1/payments/escrow/:taskId", async ({ params, request }) => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();

    if (serviceDownState.payment) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Payment service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const escrow = MOCK_ESCROWS[params.taskId as string];
    if (!escrow) {
      return HttpResponse.json(
        { code: "NOT_FOUND", detail: "Escrow record not found", correlationId: corrId },
        { status: 404, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(escrow, { headers: { "X-Correlation-Id": corrId } });
  }),
  http.get("*/api/v1/payment/escrow/:taskId", async ({ params, request }) => {
    await delay(Math.floor(Math.random() * 400) + 300);
    const corrId = generateUuid();

    if (serviceDownState.payment) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Payment service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const escrow = MOCK_ESCROWS[params.taskId as string];
    if (!escrow) {
      return HttpResponse.json(
        { code: "NOT_FOUND", detail: "Escrow record not found", correlationId: corrId },
        { status: 404, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json(escrow, { headers: { "X-Correlation-Id": corrId } });
  }),
];

// ==================== NOTIFICATION HANDLERS ====================
export const notificationHandlers: HttpHandler[] = [
  http.get("*/api/v1/notifications", async ({ request }) => {
    await delay(300);
    const corrId = generateUuid();

    if (serviceDownState.notification) {
      return HttpResponse.json(
        { code: "SERVICE_UNAVAILABLE", detail: "Notification service unavailable", correlationId: corrId },
        { status: 503, headers: { "X-Correlation-Id": corrId } }
      );
    }

    const authCheck = verifyAuth(request);
    if (!authCheck.valid) {
      return HttpResponse.json(
        { code: authCheck.code, detail: authCheck.detail, correlationId: corrId },
        { status: authCheck.status, headers: { "X-Correlation-Id": corrId } }
      );
    }

    return HttpResponse.json({ items: [] }, { headers: { "X-Correlation-Id": corrId } });
  }),
];

// ==================== PROJECT HANDLERS ====================
export const projectHandlers: HttpHandler[] = [
  http.get("*/api/v1/projects", async () => {
    await delay(300);
    const corrId = generateUuid();
    return HttpResponse.json(
      {
        items: [
          {
            id: "proj_1024",
            title: "Fix payment callback webhook race condition & idempotency",
            description: "Investigate and fix payment webhook race condition...",
            budget: 5000,
            currency: "INR",
            deadline: "2026-09-10",
            required_skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Pytest"],
            status: "IN_PROGRESS",
            owner_id: "usr_owner_1",
          },
        ],
        total: 1,
        page: 1,
      },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),
  http.get("*/api/v1/projects/:id", async ({ params }) => {
    await delay(300);
    const corrId = generateUuid();
    return HttpResponse.json(
      {
        id: params.id,
        title: "Fix payment callback webhook race condition & idempotency",
        description: "Multiple gateway callbacks arriving within 50ms cause concurrent transactions...",
        expected_result: "All incoming callback events must be idempotent.",
        budget: 5000,
        currency: "INR",
        deadline: "2026-09-10",
        required_skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Pytest"],
        status: "IN_PROGRESS",
        owner_name: "CodeBridge FinTech Team",
      },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),
];

// ==================== PROFILE HANDLERS ====================
export const profileHandlers: HttpHandler[] = [
  http.get("*/api/v1/profile/verified-work", async () => {
    await delay(300);
    const corrId = generateUuid();
    return HttpResponse.json(
      {
        records: [
          {
            id: "CB-VER-891",
            project_id: "proj_1024",
            project_title: "Fix payment callback idempotency & signature verification",
            completed_at: "2026-09-08T18:30:00.000Z",
            payout_amount: 5000,
            currency: "INR",
            payout_status: "RELEASED",
            skills_proven: ["Python", "FastAPI", "PostgreSQL", "Pytest", "Idempotency"],
            verification_badge: "VERIFIED_TEST_PASS_100",
            repo_ref: "git.codebridge.dev/repos/proj_1024@c4b2a8f",
            reviewer: "Verified by CodeBridge Automated Escrow Test-Gate",
            recruiter_proof_url: "https://verify.codebridge.dev/c/CB-VER-891-92A8",
          },
        ],
      },
      { headers: { "X-Correlation-Id": corrId } }
    );
  }),
];

export const serviceHandlers: Record<string, HttpHandler[]> = {
  identity: identityHandlers,
  workspace: workspaceHandlers,
  submission: submissionHandlers,
  ai: aiHandlers,
  payment: paymentHandlers,
  notification: notificationHandlers,
  project: projectHandlers,
  profile: profileHandlers,
};

export const handlers: HttpHandler[] = [
  ...identityHandlers,
  ...workspaceHandlers,
  ...submissionHandlers,
  ...aiHandlers,
  ...paymentHandlers,
  ...notificationHandlers,
  ...projectHandlers,
  ...profileHandlers,
];

export function getHandlersForServices(serviceNames: string[]): HttpHandler[] {
  const result: HttpHandler[] = [];
  for (const name of serviceNames) {
    const key = name.toLowerCase().trim();
    if (serviceHandlers[key]) {
      result.push(...serviceHandlers[key]);
    }
  }
  return result;
}
