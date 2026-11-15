# CodeBridge Cross-App Contract

This contract defines the protocols, boundaries, and shared conventions for CodeBridge micro-frontends (signin, create-account, dashboard, account).

## 1. Links & Navigation
- Cross-app transitions MUST use plain `<a href="...">` or `window.location.assign(...)` with environment URLs only.
- Never use internal SPA router links across apps.
- Never use iframes to embed other apps.
- Environment URLs:
  - `VITE_SIGNIN_URL` (default: `http://localhost:5173/login`)
  - `VITE_ACCOUNT_URL` (default: `http://localhost:5176/`)
  - `VITE_WORKSPACE_URL` (default: `http://localhost:5177/`)
- Workspace Link Format:
  - `${VITE_WORKSPACE_URL}?task=${task.id}` (opens workspace with preselected task)
- Standard Development Ports:
  - `signin`: 5173
  - `create-account`: 5174
  - `dashboard`: 5175 (this app)
  - `account`: 5176
  - `freelancer workspace`: 5177

## 2. Session & Token Handling
- The refresh token is an `httpOnly` cookie set by the Identity service and shared across all apps on the same domain/origin (behind the gateway).
- The dashboard app keeps the short-lived access token in memory ONLY.
- On initial page load, the session is restored via `POST /auth/refresh`.
- Access tokens and refresh tokens MUST NEVER be stored in URLs, `localStorage`, or `sessionStorage`.

## 3. Mock Cookie Contract
- When running in mock mode (`VITE_USE_MOCKS=true`):
  - Cookie name: `mock_rt`
  - Value: base64-encoded JSON `{id, email, displayName, role, status, createdAt}`
  - Attributes: `Path=/; Max-Age=604800; SameSite=Lax` (7 days)
  - Read and written exclusively inside `mocks/`.

## 4. Events Envelope & Authorization Matrix
- Envelope structure:
  ```json
  {
    "id": "string (uuid)",
    "type": "string",
    "occurredAt": "string (ISO8601)",
    "source": "string",
    "correlationId": "string (uuid)",
    "data": {}
  }
  ```
- Event types and visibility by role:
  - `user.registered` `{userId, role, displayName}`: `admin`
  - `project.status_changed` `{projectId, title, from, to}`: `owner`, `admin`
  - `payment.held` `{paymentId, projectTitle, amount}`: `owner`, `admin`
  - `payment.released` `{paymentId, projectTitle, amount}`: `owner`, `freelancer`, `admin`
  - `task.assigned` `{taskId, title, projectTitle}`: `freelancer`
  - `service.degraded` `{service, status}`: `admin`
- In production, the backend event gateway filters events based on user claims. In mock mode, the mock layer enforces this role filtering.

## 5. Realtime Transport & Handshake
- Realtime endpoint: WebSocket at `VITE_WS_URL` (default: `/ws/events`).
  - Convert `http:` -> `ws:`, `https:` -> `wss:` against the current window origin.
- Handshake sequence:
  1. Client establishes connection.
  2. Client sends: `{"type": "auth", "token": "<access_token>"}`
  3. Server replies: `{"type": "auth.ok"}`
  4. Subsequent server messages deliver event envelopes one-by-one.
- Re-authentication:
  - The client re-sends the auth message with the new access token after every proactive or reactive token refresh.
- Mock Transport:
  - Operates over a `BroadcastChannel` named `"cb-events"` (same origin). Events emitted by `create-account` or the local simulator are broadcast through this channel.

## 6. Multi-tab Logout Synchronization
- Global sign-out broadcasts `{"type": "logout"}` over a `BroadcastChannel` named `"cb-auth"`.
- Every dashboard tab listening on `"cb-auth"` that receives this message clears its in-memory session state and navigates immediately to `VITE_SIGNIN_URL`.

