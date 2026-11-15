import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';
  const useMocks = env.VITE_USE_MOCKS === 'true';
  const rawGateway = env.VITE_GATEWAY_URL || env.VITE_API_URL || 'http://localhost:8000';
  const gatewayUrl = rawGateway.trim();

  return {
    base: basePath,
    plugins: [react()],
    server: {
      host: true,
      port: 5175,
      strictPort: true,
      proxy: !useMocks
        ? {
            '/api': {
              target: gatewayUrl,
              changeOrigin: true,
              secure: false,
              headers: {
                'Bypass-Tunnel-Reminder': 'true',
              },
            },
            '/ws': {
              target: gatewayUrl,
              ws: true,
              changeOrigin: true,
              secure: false,
              headers: {
                'Bypass-Tunnel-Reminder': 'true',
              },
            },
          }
        : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
