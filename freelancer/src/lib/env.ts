export interface EnvConfig {
  useMocks: boolean;
  apiBaseUrl: string;
  gatewayUrl: string;
  basePath: string;
  signinUrl: string;
  registerUrl: string;
  dashboardUrl: string;
  accountUrl: string;
  wsUrl: string;
  devTools: boolean;
  mockTokenTtlSeconds: number;
}

function parseEnv(): EnvConfig {
  const env = import.meta.env;

  const useMocks = env.VITE_USE_MOCKS === "true";
  const apiBaseUrl = (env.VITE_API_BASE_URL as string | undefined) || "/api/v1";
  const gatewayUrl = (env.VITE_GATEWAY_URL as string | undefined) || "http://localhost:8080";
  const basePath = (env.VITE_BASE_PATH as string | undefined) || "/";
  const signinUrl = (env.VITE_SIGNIN_URL as string | undefined) || "http://localhost:5173/login";
  const registerUrl = (env.VITE_REGISTER_URL as string | undefined) || "http://localhost:5173/register";
  const dashboardUrl = (env.VITE_DASHBOARD_URL as string | undefined) || "http://localhost:5175";
  const accountUrl = (env.VITE_ACCOUNT_URL as string | undefined) || "http://localhost:5176/";
  const wsUrl = (env.VITE_WS_URL as string | undefined) || "/ws/events";
  const devTools = env.VITE_DEV_TOOLS === "true" || env.DEV;
  const mockTokenTtl = parseInt((env.VITE_MOCK_TOKEN_TTL_SECONDS as string | undefined) || "900", 10);
  const mockTokenTtlSeconds = isNaN(mockTokenTtl) ? 900 : mockTokenTtl;

  return {
    useMocks,
    apiBaseUrl,
    gatewayUrl,
    basePath,
    signinUrl,
    registerUrl,
    dashboardUrl,
    accountUrl,
    wsUrl,
    devTools,
    mockTokenTtlSeconds,
  };
}

export const env: EnvConfig = parseEnv();

