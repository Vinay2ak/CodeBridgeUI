# Connection Report: CodeBridge Auth App

## 1. Backend Information
- **Backend URL:** `https://proud-swans-spend.loca.lt`
- **Gateway Prefix:** `/api/v1`
- **Verdict:** **Backend reachable**

---

## 2. Final Environment Configuration (.env)

```env
VITE_USE_MOCKS=false
VITE_GATEWAY_URL=https://proud-swans-spend.loca.lt
VITE_MOCK_SERVICES=talent,github
VITE_GITHUB_MODE=off
VITE_DASHBOARD_URL=http://localhost:5175
VITE_FREELANCER_URL=http://localhost:5177
```

*Note:* `VITE_API_URL` has been deleted from `.env` to prevent conflicting overrides.

---

## 3. Read-Only Backend Probes

All probes were executed using read-only GET requests with `-Headers @{"bypass-tunnel-reminder"="true"}`:

| Probed URL | HTTP Status | Content-Type | Body Preview / Summary | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| `https://proud-swans-spend.loca.lt/docs` | **200 OK** | `text/html; charset=utf-8` | `<!DOCTYPE html><html><head>...` | **Backend reachable**: FastAPI Swagger UI rendered successfully. |
| `https://proud-swans-spend.loca.lt/openapi.json` | **200 OK** | `application/json` | `{"openapi":"3.1.0","info":{"title":"CodeBridge API Gateway","version":"1.0.0"}...}` | **Backend reachable**: Gateway OpenAPI specification accessible. |
| `https://proud-swans-spend.loca.lt/health` | **200 OK** | `application/json` | `{"status":"healthy","service":"api-gateway","version":"1.0.0","redis":"connected"}` | **Backend reachable**: Gateway and Redis reported healthy. |
| `https://proud-swans-spend.loca.lt/api/v1/users/me` | **401 Unauthorized** | `application/json` | `{}` | **Backend reachable**: Expected 401 response for unauthenticated caller. |
| `https://proud-swans-spend.loca.lt/api/v1/auth/me` | **401 Unauthorized** | `application/json` | `{}` | **Backend reachable**: Expected 401 response for unauthenticated caller. |
| `https://proud-swans-spend.loca.lt/api/v1/github/link/me` | **200 OK** | `application/json` | `{"connected":false}` | **Backend reachable**: GitHub service connected through gateway. |
| `https://proud-swans-spend.loca.lt/api/v1/freelancers` | **200 OK** | `application/json` | `{"items":[{"id":"85546b07-4aae...","full_name":"QA User"}]}` | **Backend reachable**: Identity service active with database records. |

---

## 4. Operational Behavior Against This Backend

1. **Authentication & Registration**:
   - **Sign In (`/login`)**: Calls `POST /api/v1/auth/login` on the real remote backend. Validates credentials and receives real access token + httpOnly refresh cookie.
   - **Registration (`/register` Step 0)**: Calls `POST /api/v1/auth/register` on the real remote backend. Creates real accounts in PostgreSQL.
   - **Session Restoration (`restoreSession`)**: Restores active session via `POST /api/v1/auth/refresh` on page reload using the browser's httpOnly refresh cookie.
2. **Mock Fallback (`VITE_MOCK_SERVICES=talent,github`)**:
   - `identity-service` runs 100% against the real remote backend.
   - `talent` and `github` services remain intercepted by MSW with `onUnhandledRequest: "bypass"`, ensuring onboarding can proceed seamlessly even if partner GitHub OAuth credentials are not configured.
3. **Vite Proxy Cookie Rewriting**:
   - In development, the Vite proxy `/api` rewrites remote `Set-Cookie` headers by stripping `;Secure`, changing `SameSite=None` to `SameSite=Lax`, and removing `;Domain=...`, ensuring the browser on `http://localhost:5173` accepts and preserves the session cookie.
4. **Relative API Base**:
   - All browser requests use relative `/api/v1/...` routes forwarded through Vite's local dev proxy, preventing tunnel reminder interstitials and CORS issues.

---

## 5. Next Actions for User

1. Open PowerShell and navigate to the auth directory:
   ```powershell
   cd d:\CodebridgeSignin\auth
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open your browser and navigate to:
   **`http://localhost:5173/register`** (or **`http://localhost:5173/login`**)
4. **Important Reminder**:
   - If the dev server was already running, stop it with `Ctrl+C` and restart it so the updated `.env` and `vite.config.ts` take effect.
   - Clear existing `localhost:5173` cookies and unregister any old mock service workers once in DevTools (`Application > Storage > Clear site data`) before testing fresh registration against the partner backend.
