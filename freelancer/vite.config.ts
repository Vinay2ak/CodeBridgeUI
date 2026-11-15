import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = env.VITE_BASE_PATH || "/";
  const useMocks = env.VITE_USE_MOCKS === "true";
  const gatewayUrl = (
    env.VITE_API_URL ||
    env.VITE_GATEWAY_URL ||
    "http://localhost:8000"
  )
    .trim()
    .replace(/\/$/, "");

  return {
    base: basePath,
    plugins: [react()],
    server: {
      port: 5177,
      strictPort: true,
      proxy: !useMocks
        ? {
            "/api": {
              target: gatewayUrl,
              changeOrigin: true,
              ws: true,
              secure: false,
              headers: {
                "Bypass-Tunnel-Reminder": "true",
              },
            },
            "/ws": {
              target: gatewayUrl,
              ws: true,
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path.replace(/^\/ws(\/events)?/, "/api/v1/notifications/ws"),
              headers: {
                "Bypass-Tunnel-Reminder": "true",
              },
            },
          }
        : undefined,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      pool: "forks",
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  };
});

