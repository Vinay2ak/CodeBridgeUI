import { writeMockRtCookie } from "./handlers";

interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "freelancer" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  onboardingCompleted: boolean;
}

const DEMO_USERS: Record<string, DemoUser> = {
  freelancer: {
    id: "usr_ravi_123",
    email: "ravi@codebridge.dev",
    displayName: "Ravi Freelancer",
    role: "freelancer",
    status: "active",
    createdAt: "2026-01-15T10:00:00Z",
    onboardingCompleted: true,
  },
  owner: {
    id: "usr_asha_456",
    email: "asha@codebridge.dev",
    displayName: "Asha Owner",
    role: "owner",
    status: "active",
    createdAt: "2026-01-10T08:00:00Z",
    onboardingCompleted: true,
  },
  admin: {
    id: "usr_admin_789",
    email: "admin@codebridge.dev",
    displayName: "Admin User",
    role: "admin",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    onboardingCompleted: true,
  },
};

export function handleDevRoleBootstrap(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role");

  if (roleParam && ["owner", "freelancer", "admin"].includes(roleParam)) {
    const demoUser = DEMO_USERS[roleParam];
    if (demoUser) {
      writeMockRtCookie(demoUser);
    }

    params.delete("role");
    const newQuery = params.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", newUrl);
  }
}

