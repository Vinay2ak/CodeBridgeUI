# Cross-App Contract

This document defines how CodeBridge frontend applications (`auth`, `dashboard`, `account`) connect to each other and to the Identity microservice behind the `/api/v1` gateway.

## 1. Navigation & Dev Ports

- Dev ports:
  - `auth` (this app): `5173`
  - `dashboard`: `5175`
  - `account`: `5176`
- Cross-app navigation from `auth` to `dashboard` uses only plain `<a href>` or `window.location.assign` with `VITE_DASHBOARD_URL` (default `http://localhost:5175`).
- Inside `auth`, client-side router links (`react-router-dom`) between `/login` and `/register` are allowed.
- Never import code from sibling frontend applications; every app builds and runs independently even when other apps are down.

## 2. Session & Token Storage

- The refresh token is an `httpOnly` cookie set by the Identity service and shared across apps under one origin behind the API gateway.
- Frontend apps keep the short-lived access token in **memory only** and restore the session on load via `POST /api/v1/auth/refresh` followed by `GET /api/v1/users/me`.
- Never store tokens in URLs, `localStorage`, or `sessionStorage`.

## 3. Mock Refresh Cookie (`mock_rt`)

- In mock mode (`VITE_USE_MOCKS=true`), MSW simulates the refresh cookie using `mock_rt`:
  - Format: base64-encoded UTF-8 JSON `{id, email, displayName, role, status, createdAt, onboardingCompleted}`.
  - Attributes: `path=/; max-age=604800; SameSite=Lax` (7 days).
  - Read and written **only** inside `src/mocks/`.
  - A missing `onboardingCompleted` field defaults to `true`.

## 4. Onboarding Gate

- Any signed-in user with `onboardingCompleted === false` must complete onboarding at `/register?resume=1` on the `auth` app before accessing any dashboard route.

## 5. Cross-Tab Logout Sync

- Signing out posts `{ "type": "logout" }` on `BroadcastChannel("cb-auth")`.
- Every open tab of this app listening on `"cb-auth"` that receives `{ "type": "logout" }` clears its in-memory session and navigates to `/login`.

## 6. Identity Service API Contract (`/api/v1`)

### Endpoints

- `POST /auth/login`
  - Request: `{ "email": string, "password": string }`
  - Response (`200 OK`): `{ "user": User, "accessToken": string, "expiresIn": number }` (sets refresh cookie)
- `POST /auth/refresh`
  - Response (`200 OK`): `{ "accessToken": string, "expiresIn": number }`
- `GET /users/me`
  - Response (`200 OK`): `User`
- `POST /auth/logout`
  - Response (`204 No Content`)

### `User` Shape

```ts
type User = {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "freelancer" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  onboardingCompleted: boolean;
};
```

### Error Shape & Codes

All error responses return JSON `{ type, title, status, code, detail, correlationId }` (and optional `errors` for validation) and every response carries the `X-Correlation-Id` header.

- `INVALID_CREDENTIALS` (`401`)
- `TOKEN_EXPIRED` (`401`)
- `UNAUTHENTICATED` (`401`)
- `REFRESH_INVALID` (`401`)
- `ACCOUNT_SUSPENDED` (`403`)
- `VALIDATION_FAILED` (`422`)
- `RATE_LIMITED` (`429`, includes `Retry-After` header)
- `SERVICE_UNAVAILABLE` (`503`)

## 7. Service Ownership

- `identity`: account lifecycle, authentication, and owner profile (`POST /auth/register`, `PUT /users/me/owner-profile`)
- `talent`: freelancer profile (`PUT /talent/profiles/me`)
- `github`: GitHub link status and linking (`GET /github/link/me`, `POST /github/link/mock`)
- In the real backend, `talent` emits `freelancer.profile_completed` and `identity` then flips `onboardingCompleted` to `true` (not part of this frontend).

## 8. Events (`src/lib/events.ts`)

- Mock channel: `BroadcastChannel("cb-events")` (`EVENT_CHANNEL = "cb-events"`), with helper `emitMockEvent(event)` (guarded when `BroadcastChannel` is unsupported, and used **only** by mocks).
- Envelope:

```ts
{
  id: string;
  type: string;
  occurredAt: string; // ISO-8601
  source: string;
  correlationId: string;
  data: Record<string, unknown>;
}
```

- Rule: **never** put `email`, `bio`, or other free-text PII in events.
- Event types:
  - `user.registered`: `{ userId, role, displayName }`
  - `freelancer.profile_completed`: `{ userId, experience, skillCount, availability }`
  - `owner.profile_completed`: `{ userId, ownerType }`

## 9. Client-Server Trust Rules

- The client **never** sends `githubVerified` or `githubConnected`; the server derives them from the GitHub link.
- The client **never** offers role `admin`.

## 10. Onboarding & GitHub Endpoints & Extra Error Codes

### Endpoints

- `POST /auth/register`
  - Request: `{ "email": string, "password": string, "displayName": string, "role": "owner" | "freelancer" }`
  - Response (`201 Created`): `{ "user": User, "accessToken": string, "expiresIn": number }` (`onboardingCompleted: false`; sets refresh cookie)
- `PUT /users/me/owner-profile` (owner only)
  - Response (`200 OK`): `{ "profile": OwnerProfile, "onboardingCompleted": true }`
- `PUT /talent/profiles/me` (freelancer only)
  - Response (`200 OK`): `{ "profile": FreelancerProfile, "onboardingCompleted": true }` (profile includes `githubVerified` and `rating: null`)
- `GET /github/link/me`
  - Response (`200 OK`): `{ "connected": boolean, "githubUsername"?: string }`
- `POST /github/link/mock` (mock only)
  - Request: `{ "githubUsername": string }`
  - Response (`200 OK`): `{ "connected": true, "githubUsername": string }`

### Extra Error Codes

- `EMAIL_TAKEN` (`409`)
- `FORBIDDEN` (`403`)
- `422` (`VALIDATION_FAILED`) bodies carry `errors: { field: string, message: string }[]`.
