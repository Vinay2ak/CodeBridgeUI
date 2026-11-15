export interface AppEnv {
  VITE_USE_MOCKS: boolean;
  VITE_API_BASE_URL: string;
  VITE_GATEWAY_URL: string;
  VITE_API_URL: string;
  VITE_BASE_PATH: string;
  VITE_SIGNIN_URL: string;
  VITE_ACCOUNT_URL: string;
  VITE_WORKSPACE_URL: string;
  VITE_WS_URL: string;
  VITE_DEV_TOOLS: boolean;
}

function parseEnv(): AppEnv {
  const metaEnv = import.meta.env;

  const VITE_USE_MOCKS = metaEnv.VITE_USE_MOCKS === 'true';
  const VITE_API_BASE_URL = metaEnv.VITE_API_BASE_URL || '/api/v1';
  const VITE_API_URL = metaEnv.VITE_API_URL || '';
  const VITE_GATEWAY_URL = metaEnv.VITE_GATEWAY_URL || metaEnv.VITE_API_URL || 'http://localhost:8080';
  const VITE_BASE_PATH = metaEnv.VITE_BASE_PATH || metaEnv.BASE_URL || '/';
  const VITE_SIGNIN_URL = metaEnv.VITE_SIGNIN_URL || 'http://localhost:5173/login';
  const VITE_ACCOUNT_URL = metaEnv.VITE_ACCOUNT_URL || 'http://localhost:5176/';
  const VITE_WORKSPACE_URL = metaEnv.VITE_WORKSPACE_URL || 'http://localhost:5177/';
  const VITE_WS_URL = metaEnv.VITE_WS_URL || '/ws/events';
  const VITE_DEV_TOOLS = metaEnv.VITE_DEV_TOOLS === 'true';

  return {
    VITE_USE_MOCKS,
    VITE_API_BASE_URL,
    VITE_GATEWAY_URL,
    VITE_API_URL,
    VITE_BASE_PATH,
    VITE_SIGNIN_URL,
    VITE_ACCOUNT_URL,
    VITE_WORKSPACE_URL,
    VITE_WS_URL,
    VITE_DEV_TOOLS,
  };
}

export const env = parseEnv();
