# CodeBridge Auth Integration Notes

## 1. Overview & Architectural Decisions

- **Token Storage Strategy**:
  - The access token is stored strictly in memory (`_accessToken` in `http.ts` and active session state in `session.ts`). It is never written to `localStorage` or `sessionStorage` in real backend mode.
  - The refresh token travels as an **httpOnly cookie** (`refresh_token`, Path `/`, 7-day expiration) set and cleared by the backend (`POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`).
  - All HTTP requests use `credentials: "include"`, enabling automatic propagation of the httpOnly refresh cookie across sessions.
  - In real mode, if the user reloads the page, `restoreSession()` triggers a background refresh call (`POST /api/v1/auth/refresh`) using the browser's httpOnly cookie. If the cookie is expired or absent, the session resets to anonymous.
- **Realtime / WebSockets**:
  - The `codebridge-auth` app does not maintain active WebSocket subscriptions (realtime event processing is handled by the Dashboard and Freelancer apps).
  - The Vite dev proxy includes `/ws` with `ws: true` pointing to `VITE_GATEWAY_URL` for consistency. The live backend WebSocket endpoint is documented at `ws://localhost:8000/notifications/ws`.

---

## 2. Endpoint Mapping & Status Table

The table below catalogs every endpoint called by `codebridge-auth`:

| Frontend Service | Method | Backend Gateway Path | Status | Notes & Adapted Changes |
| :--- | :--- | :--- | :--- | :--- |
| `identity` | `POST` | `/api/v1/auth/register` | `adapted (what changed)` | Maps `displayName` $\rightarrow$ `full_name`, converts role `"owner"`/`"freelancer"` $\rightarrow$ `"OWNER"`/`"FREELANCER"`. Adapts backend user envelope to app's `User` type. |
| `identity` | `POST` | `/api/v1/auth/login` | `adapted (what changed)` | Sends `{ email, password }`. Adapts `TokenPairResponse` (`access_token`, `refresh_token`, `expires_in`, `user`) into app's `AuthResponse`. |
| `identity` | `POST` | `/api/v1/auth/refresh` | `adapted (what changed)` | Sends httpOnly cookie with optional body `{ refreshToken }`. Adapts rotated token pair into `RefreshResponse`. |
| `identity` | `GET` | `/api/v1/users/me` | `adapted (what changed)` | Resolves active user session. Maps `full_name` $\rightarrow$ `displayName`, `created_at` $\rightarrow$ `createdAt`, uppercase `role` $\rightarrow$ lowercase `role`. Fallback to `/api/v1/auth/me`. |
| `identity` | `POST` | `/api/v1/auth/logout` | `works as-is` | Revokes server token family and clears httpOnly `refresh_token` cookie. Clears memory session. |
| `identity` | `PUT` | `/api/v1/users/me/owner-profile` | `adapted (what changed)` | Stores owner onboarding profile. Backend accepts free-form JSON and updates `full_name` with `organizationName`. Fallback to `PATCH /api/v1/profile`. |
| `identity` | `GET` | `/api/v1/users/me/owner-profile` | `missing in backend (mock needed)` | Marked **NOT FOUND** in contract. Profile reading is fulfilled via `GET /api/v1/users/me`. |
| `talent` | `PUT` | `/api/v1/talent/profiles/me` | `adapted (what changed)` | Saves freelancer onboarding profile. Secondary fallback to `PATCH /api/v1/freelancers/me` (maps integer `experience_years`, uppercase `availability`). |
| `github` | `GET` | `/api/v1/github/link/me` | `works as-is` | Checks GitHub link status (`connected`, `githubUsername`). |
| `github` | `POST` | `/api/v1/github/link/mock` | `works as-is` | Simulates GitHub account linking when `VITE_GITHUB_MODE=mock`. |

---

## 3. Screen & Panel Operational Matrix

| Screen / Flow | Real Backend Status | Fallback Required? |
| :--- | :--- | :--- |
| **Sign In (`/login`)** | **Fully Operational** against real backend (`/api/v1/auth/login`) | No |
| **Registration (`/register` Step 0)** | **Fully Operational** against real backend (`/api/v1/auth/register`) | No |
| **Owner Onboarding (`/register` Steps 1-3)** | **Fully Operational** (`/api/v1/users/me/owner-profile` & `/api/v1/profile`) | No |
| **Freelancer Onboarding (`/register` Steps 1-3)** | **Fully Operational** (`/api/v1/talent/profiles/me` & `/api/v1/freelancers/me`) | No |
| **GitHub Verification Dialog** | **Operational** via `/api/v1/github/link/mock` when `VITE_GITHUB_MODE=mock` | Set `VITE_GITHUB_MODE=off` if GitHub service is unlinked |
| **Session Bootstrap (`restoreSession`)** | **Fully Operational** via httpOnly cookie refresh (`/api/v1/auth/refresh`) | No |

---

## 4. Mock These Services for Now

If specific microservices are not running or if extended profile persistence needs to be mocked:

| Service Name | Exact `VITE_MOCK_SERVICES` Value | Reason |
| :--- | :--- | :--- |
| **Talent Service** | `VITE_MOCK_SERVICES=talent` | Use if downstream talent/freelancer profile routes (`/talent/profiles/me`) are disabled. |
| **GitHub Service** | `VITE_MOCK_SERVICES=github` | Use if GitHub OAuth service (port 8003) is not deployed in development. |
| **Identity Service** | `VITE_MOCK_SERVICES=identity` | Use if Identity service (port 8001) is offline. |

*To run with both Talent and GitHub mocked against a real Identity service:*
```env
VITE_USE_MOCKS=false
VITE_MOCK_SERVICES=talent,github
```
