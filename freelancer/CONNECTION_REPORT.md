# Backend Connection Report: CodeBridge Freelancer Workspace

**Generated**: 2026-11-17  
**App Workspace**: `freelancer` (`D:\CodeFreelancer\freelancer`)  
**Backend Target URL**: `https://proud-swans-spend.loca.lt` (API prefix `/api/v1`)

---

## 1. Active Configuration (`.env`)

```env
VITE_USE_MOCKS=false
VITE_GATEWAY_URL=https://proud-swans-spend.loca.lt
VITE_GITHUB_MODE=off
VITE_MOCK_SERVICES=
VITE_API_BASE_URL=/api/v1
VITE_BASE_PATH=/
VITE_SIGNIN_URL=http://localhost:5173/login
VITE_REGISTER_URL=http://localhost:5173/register
VITE_DASHBOARD_URL=http://localhost:5175
VITE_ACCOUNT_URL=http://localhost:5176/
VITE_WS_URL=/api/v1/notifications/ws
VITE_DEV_TOOLS=true
VITE_MOCK_TOKEN_TTL_SECONDS=900
```

* Backup created at `.env.mock.backup`.
* Added `.env.mock.backup` to `.gitignore`.
* Deprecated direct `VITE_API_URL` removed to route all browser API traffic through the relative dev proxy.

---

## 2. Read-Only Probe Results

All probes were executed using read-only `GET` requests with `bypass-tunnel-reminder: true` and `ngrok-skip-browser-warning: true` headers.

| Endpoint | Method | HTTP Status | Content-Type | Response Preview / Verdict |
| :--- | :---: | :---: | :--- | :--- |
| `/health` | `GET` | **200 OK** | `application/json` | `{"status":"healthy","service":"api-gateway","version":"1.0.0","redis":"connected"}` — Gateway & Redis healthy |
| `/ready` | `GET` | **200 OK** | `application/json` | `{"status":"ready","service":"api-gateway","version":"1.0.0"}` — Gateway ready |
| `/docs` | `GET` | **200 OK** | `text/html; charset=utf-8` | Interactive Swagger/OpenAPI documentation page rendered |
| `/openapi.json` | `GET` | **200 OK** | `application/json` | `{"openapi":"3.1.0","info":{"title":"CodeBridge API Gateway","version":"1.0.0"},...}` |
| `/api/v1/projects` | `GET` | **401 Unauthorized** | `application/json` | Route exists; JWT authentication is enforced |
| `/api/v1/tasks/mine` | `GET` | **401 Unauthorized** | `application/json` | Route exists; JWT authentication is enforced |
| `/api/v1/users/me` | `GET` | **401 Unauthorized** | `application/json` | Route exists; JWT authentication is enforced |
| `/api/v1/notifications` | `GET` | **401 Unauthorized** | `application/json` | Route exists; JWT authentication is enforced |
| `/api/v1/payment/escrow/1`| `GET` | **401 Unauthorized** | `application/json` | Route exists; JWT authentication is enforced |

### Probe Summary
* **Gateway Status**: **Reachable and Healthy**.
* **Tunnel Status**: Active and passing requests without tunnel blockage.
* **Security & Auth**: All protected endpoints under `/api/v1` respond with `401 Unauthorized` when unauthenticated, confirming all routes exist and protect resources properly.

---

## 3. Proxy Configuration (`vite.config.ts`)

Configured Vite dev server on port `5177`:
* **HTTP Proxy**: `/api` routes forwarded to `https://proud-swans-spend.loca.lt` with `changeOrigin: true`, `secure: true`, and tunnel bypass headers (`bypass-tunnel-reminder: true`, `ngrok-skip-browser-warning: true`).
* **WebSocket Proxy**: `/ws` routes proxied with `ws: true` and path rewrite to `/api/v1/notifications/ws`.
* **Cookie Rewriting**: In development, `configure(proxy)` intercepts `proxyRes` and strips `; Secure`, rewrites `SameSite=None` to `SameSite=Lax`, and clears `Domain` restrictions so `refresh_token` cookies set by the remote HTTPS gateway are accepted by `http://localhost:5177`.

---

## 4. Verification & Test Suite

* **Production Build**: `npm run build` (`tsc -b && vite build`) succeeded with 0 errors.
* **Vitest Suite**: `npx vitest run` passed: 15 test files, 162 unit & adapter tests passing.

---

## 5. Next Steps for User

1. **Start the Freelancer Dev Server**:
   ```powershell
   cd D:\CodeFreelancer\freelancer
   npm run dev -- --port 5177
   ```
2. **Access the App**:
   Navigate to [http://localhost:5177](http://localhost:5177).
3. **Log in via CodeBridge Auth App**:
   * If not logged in, authenticate through `http://localhost:5173/login` or receive the token handoff from the Auth app.
   * If switching from a previous backend or mock session, clear cookies and `localStorage` in DevTools (`F12` > Application > Clear storage).
