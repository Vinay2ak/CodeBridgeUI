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



## 7. Project Posting, Matching & Talent Contract

All endpoints run under `/api/v1` with Bearer token authentication, camelCase JSON payloads, and money in INR (Indian Rupee).

### Project Service Endpoints

#### `POST /projects`
- **Headers:** `Idempotency-Key: <uuid>` (required for safe retries)
- **Request Body:**
  ```json
  {
    "title": "string (10-80 chars)",
    "description": "string (40-1500 chars)",
    "blockerType": "HARD_BUG | UNFINISHED_FEATURE | MISSING_INTEGRATION | TEST_CI_FAILURE",
    "stacks": ["PYTHON_FASTAPI", "REACT_TS", "POSTGRES_SQL", "..."],
    "specialties": ["AUTH_RBAC", "PAYMENT_WEBHOOKS", "DB_MIGRATIONS", "..."],
    "skills": ["string (2-24 chars, unique)"],
    "budget": 5000,
    "urgency": "ASAP | THIS_WEEK | FLEXIBLE",
    "repoUrl": "https://github.com/owner/repo (optional)",
    "verificationMode": "AUTO_TESTS_AND_REVIEW | MANUAL_REVIEW_ONLY"
  }
  ```
- **Responses:**
  - `201 Created`: Returns `ProjectDetail` with status `open`, `size` derived from budget, and `matchingStatus: "computing"`.
  - `422 Unprocessable Entity`: Validation failed with field errors array.
  - `503 Service Unavailable`: Project service degraded.

#### `GET /projects/{id}`
- **Responses:**
  - `200 OK`: `ProjectDetail`
  - `403 Forbidden`: `{"type": "about:blank", "title": "Forbidden", "status": 403, "code": "FORBIDDEN"}`
  - `404 Not Found`: `{"type": "about:blank", "title": "Project Not Found", "status": 404, "code": "NOT_FOUND"}`

#### `GET /projects`
- **Responses:**
  - `200 OK`: `{ "items": Project[] }` containing posted projects first (sorted newest first), followed by active/historical projects.

#### `PUT /projects/{id}/shortlist/{freelancerId}`
- **Responses:**
  - `204 No Content`: Developer added to project shortlist.

#### `DELETE /projects/{id}/shortlist/{freelancerId}`
- **Responses:**
  - `204 No Content`: Developer removed from project shortlist.

---

### Talent Service Endpoints

#### `GET /talent/matches/{projectId}`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "status": "computing | ready | failed",
      "computedAt": "string (ISO8601) | null",
      "totalCandidates": 12,
      "items": [
        {
          "freelancer": {
            "id": "f-1",
            "displayName": "Aarav Patel",
            "headline": "FastAPI & Python backend developer",
            "experience": "MID_LEVEL",
            "availability": "IMMEDIATE",
            "minBudget": 3000,
            "githubVerified": true,
            "verifiedWorkCount": 4,
            "rating": 4.9,
            "supportedStacks": ["PYTHON_FASTAPI"],
            "debuggingSpecialties": ["PAYMENT_WEBHOOKS", "TESTING"],
            "skills": ["Python", "FastAPI"],
            "isNew": false
          },
          "score": 92,
          "label": "excellent",
          "breakdown": {
            "stack": { "points": 30, "max": 30 },
            "specialty": { "points": 20, "max": 20 },
            "skills": { "points": 15, "max": 15 },
            "budget": { "points": 10, "max": 10 },
            "availability": { "points": 10, "max": 10 },
            "experience": { "points": 10, "max": 10 },
            "trust": { "points": 5, "max": 5 }
          },
          "reasons": [
            "Matches all primary stacks: Python / FastAPI",
            "Specializes in Payment / webhook callbacks",
            "Fits your budget",
            "Available now",
            "GitHub verified"
          ],
          "warnings": [],
          "shortlisted": false
        }
      ]
    }
    ```
  - `403 Forbidden`: `{"code": "FORBIDDEN"}`
  - `404 Not Found`: `{"code": "NOT_FOUND"}`
  - `503 Service Unavailable`: `{"code": "SERVICE_UNAVAILABLE"}`

#### `GET /talent/freelancers/{id}`
- **Responses:**
  - `200 OK`: `FreelancerProfile` (includes `bio`, `githubUsername`, `portfolioUrl`, `memberSince`)
  - `404 Not Found`: Developer not found.

---

### Identity Service Endpoints

#### `GET /users/me/owner-profile`
- **Responses:**
  - `200 OK`: `OwnerProfile` (primary stacks, typical blocker, budget range, preferred verification mode)
  - `404 Not Found`: No owner profile saved.

---

### Realtime Events
- **`project.posted`**:
  - `occurredAt`: ISO8601 timestamp
  - `source`: `"project-service"`
  - `data`: `{ "projectId": "string", "title": "string", "budget": 5000 }`
  - Authorized Roles: `owner`, `admin`

---

## 8. Analytics (Grafana embed)
- Grafana runs on the backend machine at port 3001.
- Dashboard UID: `codebridge-analytics`, path: `/d/codebridge-analytics/codebridge-platform-analytics`, orgId: 1.
- Embedding and anonymous viewing are enabled on Grafana (`GF_SECURITY_ALLOW_EMBEDDING=true` and `GF_AUTH_ANONYMOUS_ENABLED=true`), so the embedded iframe requires no authentication prompts and no extra headers.
- Full dashboard URL configured via environment variable `VITE_GRAFANA_URL` (format: `http://<backend-host>:3001/d/codebridge-analytics/codebridge-platform-analytics?orgId=1&kiosk`).
- The application never hardcodes any host, IP, or port in source code. When `VITE_GRAFANA_URL` is omitted or empty, the Analytics page displays a neutral "not configured" guidance state.
- Range (`from=now-<range>&to=now`), auto-refresh (`refresh=<value>`), and theme (`theme=dark|light`) query parameters are dynamically managed by the client adapter.

