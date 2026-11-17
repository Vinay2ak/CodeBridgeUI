# CodeBridge Dashboard Integration Notes

This document describes how the CodeBridge Dashboard (`dashboard`, port 5175) integrates with the real CodeBridge backend described in `FRONTEND_CONTRACT.md`.

---

## 1. Authentication & Token Management Decision

* **In-Memory Access Token:**
  The JWT access token is stored strictly in memory (`src/lib/authHeader.ts`). It is never written to `localStorage` or `sessionStorage`.
* **Refresh Token & Session Lifecycle:**
  The backend issues rotating refresh tokens via an `httpOnly` secure cookie (`refresh_token`, 7-day lifespan). All API and auth requests use `credentials: "include"`, allowing the browser to submit the cookie automatically to `/api/v1/auth/refresh`.
  If the backend returns a refresh token in the JSON body without cookie persistence, the token is held strictly in memory. The session ends on tab reload.
* **Proactive & Single-Flight Refresh:**
  Access tokens are refreshed proactively 60 seconds before JWT expiration. Concurrent API requests receiving a `401 TOKEN_EXPIRED` trigger a single-flight refresh call; all pending requests are replayed once with the new token.

---

## 2. Mock Fallback Strategy (`VITE_MOCK_SERVICES`)

When `VITE_USE_MOCKS=true`, MSW mocks all endpoints for full standalone local development.
When `VITE_USE_MOCKS=false`, MSW starts **only** if `VITE_MOCK_SERVICES` is set to a non-empty comma-separated list of service folder names (e.g. `talent,identity`). Requests for services not in this list bypass MSW and reach the real backend through the Vite reverse proxy.

### Mock these services for now:
```env
VITE_MOCK_SERVICES=talent,identity
```
* **Why `talent` is needed:**
  `GET /api/v1/talent/matches/{projectId}` (AI developer matching recommendations) is **NOT FOUND** in the backend contract (Section 8 explicitly confirms: *Projects: Recommended freelancers -> NOT FOUND*).
* **Why `identity` is needed (optional for extended onboarding):**
  `GET /api/v1/users/me/owner-profile` is **NOT FOUND** in the backend (contract Section 8: *Owner Profile Get -> NOT FOUND*). If omitted, the dashboard defaults to empty owner profile settings.
* **Why `project` shortlist is mocked:**
  `PUT /api/v1/projects/{id}/shortlist/{freelancerId}` is **NOT FOUND** in the backend contract.

---

## 3. Endpoints Integration Catalog

| Microservice | Endpoint | Method | Status | Notes / Adaptations |
| :--- | :--- | :--- | :--- | :--- |
| **Identity** | `/api/v1/auth/register` | `POST` | `adapted` | Maps `displayName` to `full_name`, `role` to uppercase `OWNER` / `FREELANCER`. Extracts user profile from response envelope. |
| **Identity** | `/api/v1/auth/login` | `POST` | `adapted` | Normalizes `access_token` and `refresh_token`, adapts user record into internal `User` shape. |
| **Identity** | `/api/v1/auth/refresh` | `POST` | `adapted` | Sends `refresh_token` in body or relies on httpOnly cookie. Extracts new access token in memory. |
| **Identity** | `/api/v1/auth/logout` | `POST` | `works as-is` | Clears credentials with `Authorization: Bearer <token>`. |
| **Identity** | `/api/v1/users/me` | `GET` | `adapted` | Maps `full_name` to `displayName`, `created_at` to `createdAt`, uppercase `OWNER` to lowercase `owner`. |
| **Identity** | `/api/v1/auth/me` | `GET` | `adapted` | Fallback for `/api/v1/users/me`; applies same user normalization. |
| **Identity** | `/api/v1/users/me/owner-profile` | `GET` | `missing in backend (mock needed)` | Endpoint not implemented on backend. Mock with `VITE_MOCK_SERVICES=identity` or fallback. |
| **Identity** | `/api/v1/users/me/owner-profile` | `PUT` | `adapted` | Maps frontend onboarding fields (`ownerType`, `organizationName`, etc.) to backend snake_case JSON. |
| **Identity** | `/api/v1/freelancers/{id}` | `GET` | `adapted` | Fetches vetted freelancer profile. Maps `full_name` -> `displayName`, `experience_years` -> `experience`, `skills` -> `supportedStacks`. |
| **Project** | `/api/v1/projects` | `GET` | `adapted` | Normalizes uppercase status (`OPEN` -> `open`, `ASSIGNED` -> `in_progress`, `COMPLETED` -> `completed`). Maps `required_skills` to `tags`. Unpacks `{ items: [...] }` envelope. |
| **Project** | `/api/v1/projects/{id}` | `GET` | `adapted` | Maps project details: `required_skills` to `skills` and `stacks`, determines project `size` from budget tier. |
| **Project** | `/api/v1/projects` | `POST` | `adapted` | Maps `stacks`/`skills` to `required_skills`, adds default `deadline` (+30 days), sets `currency: "INR"`, forwards `expected_result`. |
| **Project** | `/api/v1/projects/{id}/shortlist/{freelancerId}` | `PUT` | `missing in backend (mock needed)` | Endpoint not implemented on backend. |
| **Project** | `/api/v1/projects/{id}/shortlist/{freelancerId}` | `DELETE` | `missing in backend (mock needed)` | Endpoint not implemented on backend. |
| **Talent** | `/api/v1/talent/matches/{projectId}` | `GET` | `missing in backend (mock needed)` | AI freelancer match rankings not implemented in backend. Mock with `VITE_MOCK_SERVICES=talent`. |
| **Talent** | `/api/v1/talent/freelancers/{id}` | `GET` | `adapted` | Secondary fallback pointing to `/api/v1/freelancers/{id}`. |
| **Payment** | `/api/v1/payment/summary` | `GET` | `adapted` | Maps `total_spent` to `authorized`, `total_escrow` to `held`, `pendingRelease`, `released`. Fallback to `/api/v1/payments/summary`. |
| **Workspace**| `/api/v1/tasks/mine` | `GET` | `adapted` | Normalizes task status (`OPEN` -> `open`, `IN_PROGRESS` -> `in_progress`), adapts `reward` and `dueAt`. |
| **Notifications** | `/api/v1/notifications` | `GET` | `adapted` | Adapts backend notification objects (`is_read`, `created_at`) into platform `CbEvent` format. |
| **Notifications** | `/api/v1/notifications/ws` | `WS` | `adapted` | Connects via WebSocket with `?token=<access_token>` and in-band `{ type: "auth", token }` handshake; maintains 25s ping/pong keepalive. |

---

## 4. UI Screens & Panels Readiness

| Screen / Feature | Route | Real Backend Status | Required `VITE_MOCK_SERVICES` |
| :--- | :--- | :--- | :--- |
| **Owner Dashboard** | `/owner` | **Works against real backend** | None (or `identity` if custom onboarding profile is needed) |
| **Talent Directory** | `/owner` (Talent tab) | **Works against real backend** | None (reads `/api/v1/freelancers/{id}`) |
| **Post Project Wizard**| `/owner/post-project` | **Works against real backend** | None (submits to `/api/v1/projects`) |
| **Project Matches** | `/owner/projects/:id` | **Requires mock fallback** | `VITE_MOCK_SERVICES=talent` |
| **Escrow & Payments** | `/owner` (Escrow card) | **Works against real backend** | None (reads `/api/v1/payment/summary`) |
| **Notifications Dropdown**| Header | **Works against real backend** | None (reads `/api/v1/notifications` + WS) |
| **Freelancer Dashboard**| `/freelancer` | **Redirects** | Handed off to Workspace (`http://localhost:5177/`) |
