import { http, HttpResponse } from 'msw';
import { mockState, isServiceFailing } from './controls';
import {
  initialProjects,
  getPaymentsSummary,
  initialTasks,
  initialAdminUsers,
  initialServicesHealth,
  initialNotifications,
} from './data';
import { roleCanSeeEvent } from './simulator';
import { UserRole } from '../realtime/types';

function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function getMockCookie(): any | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)mock_rt=([^;]*)/);
  if (!match) return null;
  try {
    const jsonStr = atob(decodeURIComponent(match[1]));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function setMockCookie(user: any): void {
  if (typeof document === 'undefined') return;
  const encoded = btoa(JSON.stringify(user));
  document.cookie = `mock_rt=${encodeURIComponent(encoded)}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearMockCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'mock_rt=; path=/; max-age=0; SameSite=Lax';
}

// Expose helper on window for console testing
if (typeof window !== 'undefined') {
  (window as any).__setMockUser = (role: UserRole = 'owner') => {
    const users = {
      owner: {
        id: 'user-owner-1',
        email: 'asha.owner@example.com',
        displayName: 'Asha Owner',
        role: 'owner',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      freelancer: {
        id: 'user-freelancer-1',
        email: 'ravi.freelancer@example.com',
        displayName: 'Ravi Freelancer',
        role: 'freelancer',
        status: 'active',
        createdAt: '2026-01-10T00:00:00.000Z',
      },
      admin: {
        id: 'user-admin-1',
        email: 'admin.user@example.com',
        displayName: 'Admin User',
        role: 'admin',
        status: 'active',
        createdAt: '2025-10-01T00:00:00.000Z',
      },
    };
    setMockCookie(users[role]);
    window.location.reload();
  };
}

// Create fake JWT: header.payload.sig
function createFakeToken(user: any, gen: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 min
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      exp,
      gen,
    })
  );
  const sig = 'mock_sig';
  return `${header}.${payload}.${sig}`;
}

// Validate Bearer token
function validateAuthHeader(
  authHeader: string | null,
  corrId: string
): { isValid: boolean; payload?: any; errorResponse?: Response } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      errorResponse: HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthenticated',
          status: 401,
          code: 'UNAUTHENTICATED',
          detail: 'Missing or malformed Authorization header',
          correlationId: corrId,
        },
        { status: 401, headers: { 'X-Correlation-Id': corrId } }
      ),
    };
  }

  const token = authHeader.substring(7);
  try {
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid token');
    const payload = JSON.parse(atob(parts[1]));

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.gen !== mockState.tokenGen || payload.exp <= nowSec) {
      return {
        isValid: false,
        errorResponse: HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Token Expired',
            status: 401,
            code: 'TOKEN_EXPIRED',
            detail: 'The access token has expired',
            correlationId: corrId,
          },
          { status: 401, headers: { 'X-Correlation-Id': corrId } }
        ),
      };
    }

    return { isValid: true, payload };
  } catch {
    return {
      isValid: false,
      errorResponse: HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Token Expired',
          status: 401,
          code: 'TOKEN_EXPIRED',
          detail: 'Invalid token structure',
          correlationId: corrId,
        },
        { status: 401, headers: { 'X-Correlation-Id': corrId } }
      ),
    };
  }
}

// Random delay between 300ms and 800ms
async function applyRandomLatency() {
  const ms = Math.floor(Math.random() * (800 - 300 + 1)) + 300;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export const handlers = [
  // 1. Identity: POST /auth/refresh
  http.post('*/api/v1/auth/refresh', async () => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const mockUser = getMockCookie();
    if (!mockUser) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Refresh Invalid',
          status: 401,
          code: 'REFRESH_INVALID',
          detail: 'No mock_rt refresh cookie found',
          correlationId: corrId,
        },
        { status: 401, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const accessToken = createFakeToken(mockUser, mockState.tokenGen);
    return HttpResponse.json(
      {
        accessToken,
        expiresIn: 900,
      },
      { headers: { 'X-Correlation-Id': corrId } }
    );
  }),

  // 2. Identity: POST /auth/logout
  http.post('*/api/v1/auth/logout', async () => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();
    clearMockCookie();
    return new HttpResponse(null, {
      status: 204,
      headers: { 'X-Correlation-Id': corrId },
    });
  }),

  // 3. Identity: GET /users/me
  http.get('*/api/v1/users/me', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    const mockUser = getMockCookie();
    if (!mockUser) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Unauthenticated',
          status: 401,
          code: 'UNAUTHENTICATED',
          detail: 'No user session found',
          correlationId: corrId,
        },
        { status: 401, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    return HttpResponse.json(mockUser, {
      headers: { 'X-Correlation-Id': corrId },
    });
  }),

  // 4. Project: GET /projects
  http.get('*/api/v1/projects', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('project')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Project service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    return HttpResponse.json(
      { items: initialProjects },
      { headers: { 'X-Correlation-Id': corrId } }
    );
  }),

  // Project: POST /projects (Post a Project by Owner)
  http.post('*/api/v1/projects', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('project')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Project service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const newProject = {
      id: `proj-${Date.now()}`,
      title: body.title || 'Untitled Project',
      repo: body.repo || 'acme/new-service',
      freelancerName: null,
      status: body.status || 'draft',
      budget: Number(body.budget) || 500,
      updatedAt: new Date().toISOString(),
    };

    initialProjects.unshift(newProject as any);

    return HttpResponse.json(newProject, {
      status: 201,
      headers: { 'X-Correlation-Id': corrId },
    });
  }),

  // 5. Payment: GET /payments/summary
  http.get('*/api/v1/payments/summary', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('payment')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Payment service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    return HttpResponse.json(getPaymentsSummary(), {
      headers: { 'X-Correlation-Id': corrId },
    });
  }),

  // 6. Workspace: GET /tasks/mine (freelancer only)
  http.get('*/api/v1/tasks/mine', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('workspace')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Workspace service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    if (auth.payload.role !== 'freelancer') {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          code: 'FORBIDDEN',
          detail: 'Tasks can only be accessed by freelancers',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    return HttpResponse.json(
      { items: initialTasks },
      { headers: { 'X-Correlation-Id': corrId } }
    );
  }),

  // 7. Admin: GET /admin/users (admin only)
  http.get('*/api/v1/admin/users', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('admin')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Admin service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    if (auth.payload.role !== 'admin') {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          code: 'FORBIDDEN',
          detail: 'Admin endpoint forbidden for non-admin users',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    return HttpResponse.json(
      {
        total: 128,
        items: initialAdminUsers,
      },
      { headers: { 'X-Correlation-Id': corrId } }
    );
  }),

  // 8. Admin: GET /admin/health (admin only)
  http.get('*/api/v1/admin/health', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('admin')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Admin service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    if (auth.payload.role !== 'admin') {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Forbidden',
          status: 403,
          code: 'FORBIDDEN',
          detail: 'Admin health forbidden for non-admin users',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    // Reflect failing services in health status
    const healthRows = initialServicesHealth.map((row) => {
      if (isServiceFailing(row.name)) {
        return { ...row, status: 'down' as const, latencyMs: 0 };
      }
      return row;
    });

    return HttpResponse.json(
      { services: healthRows },
      { headers: { 'X-Correlation-Id': corrId } }
    );
  }),

  // 9. Notification: GET /notifications
  http.get('*/api/v1/notifications', async ({ request }) => {
    await applyRandomLatency();
    const corrId = generateCorrelationId();

    if (isServiceFailing('notification')) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Service Unavailable',
          status: 503,
          code: 'SERVICE_UNAVAILABLE',
          detail: 'Notification service is currently unavailable',
          correlationId: corrId,
        },
        { status: 503, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    if (mockState.isSuspended) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Account Suspended',
          status: 403,
          code: 'ACCOUNT_SUSPENDED',
          detail: 'Your account is suspended',
          correlationId: corrId,
        },
        { status: 403, headers: { 'X-Correlation-Id': corrId } }
      );
    }

    const auth = validateAuthHeader(request.headers.get('Authorization'), corrId);
    if (!auth.isValid) return auth.errorResponse!;

    const userRole = (auth.payload.role || 'owner') as UserRole;
    const filtered = initialNotifications
      .filter((n) => roleCanSeeEvent(userRole, n.type))
      .slice(0, 20);

    return HttpResponse.json(
      { items: filtered },
      { headers: { 'X-Correlation-Id': corrId } }
    );
  }),
];

