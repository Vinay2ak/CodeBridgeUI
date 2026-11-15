const rawApiUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env["VITE_API_URL "] as string | undefined);
const rawGatewayUrl =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) ||
  (import.meta.env["VITE_GATEWAY_URL "] as string | undefined);

export const VITE_USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export const VITE_GATEWAY_URL = (rawApiUrl || rawGatewayUrl || "http://localhost:8080")
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
export const VITE_GITHUB_MODE = (
  (import.meta.env.VITE_GITHUB_MODE as string | undefined) ?? (VITE_USE_MOCKS ? "mock" : "off")
) as "mock" | "off";
