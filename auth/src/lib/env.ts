// Environment configuration and hygiene

const rawApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env["VITE_API_URL "] as string | undefined);

if (rawApiUrl) {
  console.warn(
    "[CodeBridge env] VITE_API_URL is ignored; please configure VITE_GATEWAY_URL instead."
  );
}

const rawGatewayUrl =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) ||
  (import.meta.env["VITE_GATEWAY_URL "] as string | undefined);

export const VITE_USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const VITE_GATEWAY_URL = (rawGatewayUrl || "http://localhost:8000")
  .trim()
  .replace(/\/$/, "");

export const VITE_API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1"
)
  .trim()
  .replace(/\/$/, "");

export const VITE_DASHBOARD_URL = (
  (import.meta.env.VITE_DASHBOARD_URL as string | undefined) ?? "http://localhost:5175"
)
  .trim()
  .replace(/\/$/, "");

export const VITE_FREELANCER_URL = (
  (import.meta.env.VITE_FREELANCER_URL as string | undefined) ?? "http://localhost:5177"
)
  .trim()
  .replace(/\/$/, "");

// VITE_GITHUB_MODE accepts only "mock" or "off"
const rawGithubMode = (import.meta.env.VITE_GITHUB_MODE as string | undefined)?.trim();
let parsedGithubMode: "mock" | "off";
if (rawGithubMode === "mock") {
  parsedGithubMode = "mock";
} else if (rawGithubMode === "off") {
  parsedGithubMode = "off";
} else if (rawGithubMode === undefined || rawGithubMode === "") {
  parsedGithubMode = VITE_USE_MOCKS ? "mock" : "off";
} else {
  console.warn(
    `[CodeBridge env] Invalid VITE_GITHUB_MODE "${rawGithubMode}"; must be "mock" or "off". Defaulting to "off".`
  );
  parsedGithubMode = "off";
}
export const VITE_GITHUB_MODE = parsedGithubMode;

// VITE_MOCK_SERVICES: comma-separated list of service folder names (e.g. "talent,github")
const rawMockServices = (import.meta.env.VITE_MOCK_SERVICES as string | undefined) ?? "";
export const VITE_MOCK_SERVICES: string[] = rawMockServices
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isServiceMocked(serviceName: string): boolean {
  if (VITE_USE_MOCKS) return true;
  return VITE_MOCK_SERVICES.includes(serviceName.toLowerCase());
}

// Log environment summary once in development
if (import.meta.env.DEV && typeof console !== "undefined" && console.groupCollapsed) {
  const activeMode = VITE_USE_MOCKS ? "MOCK (all services)" : "REAL BACKEND";
  const mocked = VITE_USE_MOCKS
    ? ["identity", "talent", "github"]
    : VITE_MOCK_SERVICES.length > 0
      ? VITE_MOCK_SERVICES
      : ["none"];

  console.groupCollapsed("[CodeBridge env]");
  console.log("Active Mode:", activeMode);
  console.log("Gateway URL:", VITE_GATEWAY_URL);
  console.log("API Base URL:", VITE_API_BASE_URL);
  console.log("Mocked Services:", mocked);
  console.log("GitHub Mode:", VITE_GITHUB_MODE);
  console.groupEnd();
}
