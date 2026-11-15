export interface MockCookiePayload {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "freelancer" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  onboardingCompleted: boolean;
}

const COOKIE_NAME = "mock_rt";
const MAX_AGE = 604800;

export function writeMockCookie(payload: MockCookiePayload): void {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  document.cookie = `${COOKIE_NAME}=${b64}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function readMockCookie(): MockCookiePayload | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const b64 = match.slice(COOKIE_NAME.length + 1);
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json) as Partial<MockCookiePayload>;
    return {
      id: parsed.id ?? "",
      email: parsed.email ?? "",
      displayName: parsed.displayName ?? "",
      role: parsed.role ?? "owner",
      status: parsed.status ?? "active",
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      onboardingCompleted: parsed.onboardingCompleted ?? true,
    };
  } catch {
    return null;
  }
}

export function clearMockCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
