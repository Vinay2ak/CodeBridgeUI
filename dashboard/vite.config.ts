import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';
  const useMocks = env.VITE_USE_MOCKS === 'true';
  const rawGateway = env.VITE_GATEWAY_URL || 'http://localhost:8000';
  const gatewayUrl = rawGateway.trim();
  const isHttps = gatewayUrl.startsWith('https://');

  return {
    base: basePath,
    plugins: [react()],
    server: {
      host: true,
      port: 5175,
      strictPort: true,
      headers: {
        'Cache-Control': 'no-store',
      },
      proxy: !useMocks
        ? {
            '/api': {
              target: gatewayUrl,
              changeOrigin: true,
              secure: isHttps,
              cookieDomainRewrite: 'localhost',
              headers: {
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true',
              },
              // Dev-only workaround: rewrite Set-Cookie headers from remote HTTPS backend
              // so the refresh cookie is accepted and stored on http://localhost
              configure: (proxy) => {
                if (isHttps) {
                  proxy.on('proxyRes', (proxyRes) => {
                    const setCookie = proxyRes.headers['set-cookie'];
                    if (setCookie) {
                      proxyRes.headers['set-cookie'] = (
                        Array.isArray(setCookie) ? setCookie : [setCookie]
                      ).map((c: string) =>
                        c
                          .replace(/;\s*Secure/gi, '')
                          .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                          .replace(/;\s*Domain=[^;]+/gi, '')
                      );
                    }
                  });
                }
              },
            },
            '/ws/events': {
              target: gatewayUrl,
              ws: true,
              changeOrigin: true,
              secure: isHttps,
              cookieDomainRewrite: 'localhost',
              rewrite: (path) =>
                path.replace(/^\/ws\/events/, '/api/v1/notifications/ws'),
              headers: {
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true',
              },
            },
            '/ws': {
              target: gatewayUrl,
              ws: true,
              changeOrigin: true,
              secure: isHttps,
              cookieDomainRewrite: 'localhost',
              headers: {
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true',
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
