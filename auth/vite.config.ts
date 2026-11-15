import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH ?? "/";
  const useMocks = (process.env.VITE_USE_MOCKS ?? env.VITE_USE_MOCKS) === "true";
  const gatewayUrl = (
    process.env.VITE_API_URL ??
    env.VITE_API_URL ??
    process.env.VITE_GATEWAY_URL ??
    env.VITE_GATEWAY_URL ??
    "http://localhost:8000"
  )
    .trim()
    .replace(/\/$/, "");

  return {
    base,
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: useMocks
        ? undefined
        : {
            "/api": {
              target: gatewayUrl,
              changeOrigin: true,
              secure: false,
              headers: {
                "bypass-tunnel-reminder": "true",
              },
            },
          },
    },
    test: {
      globals: false,
      environment: "node",
    },
  };
});
