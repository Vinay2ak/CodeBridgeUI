/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_SIGNIN_URL?: string;
  readonly VITE_REGISTER_URL?: string;
  readonly VITE_DASHBOARD_URL?: string;
  readonly VITE_ACCOUNT_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_DEV_TOOLS?: string;
  readonly VITE_MOCK_TOKEN_TTL_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

