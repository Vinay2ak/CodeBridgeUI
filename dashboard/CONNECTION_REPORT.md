# CodeBridge Backend Connection Report

**Date:** 2026-11-17  
**App Directory:** `D:\CodeDashboard\dashboard`  
**Backend URL:** `https://proud-swans-spend.loca.lt`  

---

## 1. Environment Configuration

Backup saved to `.env.mock.backup`. Final `.env` configuration:

```env
VITE_USE_MOCKS=false
VITE_GATEWAY_URL=https://proud-swans-spend.loca.lt
VITE_MOCK_SERVICES=talent,identity
VITE_GITHUB_MODE=off
VITE_API_BASE_URL=/api/v1
VITE_BASE_PATH=/
VITE_SIGNIN_URL=http://localhost:5173/login
VITE_ACCOUNT_URL=http://localhost:5176/
VITE_WORKSPACE_URL=http://localhost:5177/
VITE_WS_URL=/api/v1/notifications/ws
VITE_DEV_TOOLS=true
```

* `VITE_API_URL` was removed.
* `VITE_MOCK_SERVICES` is set to `talent,identity` as specified in `INTEGRATION_NOTES.md`.

---

## 2. Probe Results & Verdict

**Verdict:** **Backend reachable** (CodeBridge API Gateway v1.0.0, Redis connected, healthy).

| Target URL | Method | Status | Content-Type | Interpretation & Details |
| :--- | :--- | :--- | :--- | :--- |
| `https://proud-swans-spend.loca.lt/docs` | `GET` | `200 OK` | `text/html; charset=utf-8` | **Backend reachable.** FastAPI Swagger UI documentation rendered properly. |
| `https://proud-swans-spend.loca.lt/openapi.json` | `GET` | `200 OK` | `application/json` | **Backend reachable.** Full OpenAPI 3.1.0 specification returned from API Gateway. |
| `https://proud-swans-spend.loca.lt/health` | `GET` | `200 OK` | `application/json` | **Backend reachable.** Responded `{"status":"healthy","service":"api-gateway","version":"1.0.0","redis":"connected"}`. |
| `https://proud-swans-spend.loca.lt/api/v1/projects` | `GET` | `401 Unauthorized` | `application/json` | **Backend reachable.** Expected response without authentication credentials. |
| `https://proud-swans-spend.loca.lt/api/v1/users/me` | `GET` | `401 Unauthorized` | `application/json` | **Backend reachable.** Expected response without authentication credentials. |
| `https://proud-swans-spend.loca.lt/api/v1/notifications` | `GET` | `401 Unauthorized` | `application/json` | **Backend reachable.** Expected response without authentication credentials. |
| `https://proud-swans-spend.loca.lt/api/v1/payment/summary` | `GET` | `401 Unauthorized` | `application/json` | **Backend reachable.** Expected response without authentication credentials. |

---

## 3. Microservices Routing & Mock Behavior

With `VITE_USE_MOCKS=false` and `VITE_MOCK_SERVICES=talent,identity`:

* **Live Against Real Backend (via reverse proxy):**
  - **Project Service (`/api/v1/projects`):** Project creation, project details, and list.
  - **Payment Service (`/api/v1/payment/summary`):** Escrow summary, held balances, released milestones.
  - **Notifications Service (`/api/v1/notifications` & `/api/v1/notifications/ws`):** REST notifications and WebSocket event stream.
  - **Identity Core Auth (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/users/me`):** Token validation and active profile.
* **Selectively Mocked by MSW (`VITE_MOCK_SERVICES`):**
  - **`talent`:** Developer matching (`/api/v1/talent/matches/{projectId}`) which is not yet present on backend.
  - **`identity`:** Custom onboarding profile (`/api/v1/users/me/owner-profile`).

---

## 4. Next Actions for User

1. Ensure the dev server is restarted so the new `.env` and `vite.config.ts` proxy take effect.
2. Clear localhost browser cookies once (to ensure fresh `httpOnly` cookie handoff) and unregister any legacy service workers.
3. Start the application with:
   ```powershell
   cd D:\CodeDashboard\dashboard; npm run dev -- --port 5175
   ```
4. Open **http://localhost:5175/owner**.
