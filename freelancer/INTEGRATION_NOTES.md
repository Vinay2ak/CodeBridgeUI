# CodeBridge Freelancer Integration Notes & Contract Conformance

This document details the integration between the **Freelancer Workspace** frontend (`freelancer-workspace`) and the **CodeBridge API Gateway** backend microservices specification described in `FRONTEND_CONTRACT.md`.

---

## 1. Auth & Session Decision (Contract Compliance)

* **Access Token Storage**: Stored **in memory only** (`SessionStore.state.accessToken`). It is never persisted to `localStorage` or `sessionStorage`.
* **Refresh Token Transport**: Follows the contract specification:
  * The real backend sets an `httpOnly` cookie named `refresh_token` (`SameSite=lax`, `Path=/`, `Max-Age=604800` / 7 days).
  * All fetch requests specify `credentials: "include"`, ensuring cookies are sent automatically to both local and remote proxies.
  * In case the backend returns the refresh token strictly in the JSON body without an httpOnly cookie, the refresh token is also kept **in memory only** (`SessionStore.inMemoryRefreshToken`). The session will cleanly end on full browser reload unless the auth cookie is present.
* **Token Handoff from Auth App**: Upon redirect from `http://localhost:5173` (e.g. `?token=...&rt=...`), the URL parameters are captured into memory and stripped from the browser URL bar via `window.history.replaceState` without touching `localStorage`.

---

## 2. Endpoint Mapping & Adapter Status Table

Below is the exhaustive inventory of all endpoints called by the Freelancer app:

| Frontend Call / Service | Full Gateway Contract Path | Method | Integration Status | What Changed / Adaptation Performed |
| :--- | :--- | :--- | :--- | :--- |
| `identityApi.refresh()` | `/api/v1/auth/refresh` | `POST` | **adapted (what changed)** | Calls with `credentials: "include"`. Adapts `{ accessToken, expiresIn }` and maps nested backend user `role` (`FREELANCER` -> `freelancer`). |
| `identityApi.logout()` | `/api/v1/auth/logout` | `POST` | **works as-is** | Backend clears `refresh_token` cookie and revokes token family in Redis/Postgres. |
| `identityApi.getCurrentUser()` | `/api/v1/users/me` | `GET` | **adapted (what changed)** | Adapts backend uppercase role (`FREELANCER` -> `freelancer`), snake_case `created_at` -> `createdAt`, and `full_name` -> `displayName`. |
| `projectApi.getProjects()` | `/api/v1/projects` | `GET` | **adapted (what changed)** | Unwraps `{ items: [...], total, page }` envelope, maps `required_skills` -> `skills`, and adapts `status: "IN_PROGRESS"` to `projectState`. |
| `projectApi.getProject()` | `/api/v1/projects/{id}` | `GET` | **adapted (what changed)** | Adapts single project record, requirements breakdown, and maps `status` & `escrow_status`. |
| `projectApi.initializeWorkspace()` | `/api/v1/workspace/projects/{id}` | `POST` | **adapted (what changed)** | Passes `{ ttl_minutes: 120 }` payload. Maps `{ workspace_id, container_id, status }` to `WorkspaceContainerInfo`. |
| `projectApi.startWorkspace()` | `/api/v1/workspace/{workspace_id}/start` | `POST` | **works as-is** | Transitions container to running state. |
| `projectApi.stopWorkspace()` | `/api/v1/workspace/{workspace_id}/stop` | `POST` | **works as-is** | Transitions container to stopped state. |
| `projectApi.runVerificationTests()` | `/api/v1/workspace/{workspace_id}/run-tests` | `POST` | **adapted (what changed)** | Adapts `{ exit_code, passed, output }` into step-by-step `TestSuiteResult` (checks 1-3 with exit code). |
| `projectApi.submitProject()` | `/api/v1/submissions/projects/{id}` | `POST` | **adapted (what changed)** | Adapts `SubmissionPayload` (`summary`, `files`, `reviewer_notes`) to backend schema and adapts response to `SubmissionRecord`. |
| `projectApi.getSubmissions()` | `/api/v1/submissions/projects/{id}` | `GET` | **adapted (what changed)** | Adapts list of backend submissions, parsing `files` array and mapping `status` (`UNDER_REVIEW` -> `in_review`). |
| `workspaceApi.getMyTasks()` | `/api/v1/tasks/mine` | `GET` | **adapted (what changed)** | Unwraps `{ items: [...] }` envelope; maps task `status` (`in_progress` \| `in_review` \| `completed`) and reward. |
| `workspaceApi.getAvailableTasks()`| `/api/v1/projects?status=OPEN` | `GET` | **adapted (what changed)** | Maps open projects into `TaskSummary` cards for task claiming/discovery. |
| `workspaceApi.getTask()` | `/api/v1/tasks/{id}` | `GET` | **adapted (what changed)** | Adapts detailed task specification, locked `repo` snapshot, `criteria`, and `history` into `Task`. |
| `workspaceApi.getWorkspace()` | `/api/v1/workspaces/{task_id}` | `GET` | **adapted (what changed)** | Maps container specs (`image`, `cpu`, `memory`, `repoAccess`, `commit`) to `Workspace`. |
| `workspaceApi.startWorkspace()` | `/api/v1/workspaces/{task_id}/start` | `POST` | **works as-is** | Starts task workspace container. |
| `workspaceApi.stopWorkspace()` | `/api/v1/workspaces/{task_id}/stop` | `POST` | **works as-is** | Stops task workspace container. |
| `workspaceApi.resetWorkspace()` | `/api/v1/workspaces/{task_id}/reset` | `POST` | **works as-is** | Resets task workspace container to clean state. |
| `workspaceApi.getFiles()` | `/api/v1/workspaces/{task_id}/files` | `GET` | **adapted (what changed)** | Adapts `{ commit, items: [{ path, type, size }] }` into `FileTreeResponse`. |
| `workspaceApi.getFileContent()` | `/api/v1/workspaces/{task_id}/files/content?path=...` | `GET` | **adapted (what changed)** | Adapts `{ path, language, content }` to `FileContentResponse`. |
| `workspaceApi.saveFileContent()` | `/api/v1/workspaces/{task_id}/files/content` | `PUT` | **adapted (what changed)** | Sends `{ path, content }`, maps `{ savedAt }` response to `FileSaveResponse`. |
| `submissionApi.startRun()` | `/api/v1/submissions/runs` | `POST` | **adapted (what changed)** | Sends `{ taskId }`, maps `{ runId }` response. |
| `submissionApi.getRun()` | `/api/v1/submissions/runs/{run_id}` | `GET` | **adapted (what changed)** | Adapts test results array and run status (`running` \| `completed`). |
| `submissionApi.submit()` | `/api/v1/submissions` | `POST` | **adapted (what changed)** | Sends `{ taskId, notes }`, maps `{ submissionId, status: "in_review" }`. |
| `submissionApi.getCurrentSubmission()`| `/api/v1/submissions/current?taskId=...` | `GET` | **adapted (what changed)** | Maps `{ status, note, lastRun }` into `CurrentSubmissionResponse`. |
| `aiApi.getContext()` | `/api/v1/ai/context/{task_id}` | `GET` | **adapted (what changed)** | Adapts `{ summary, findings, relevantFiles, approach }` into `AiContext`. |
| `paymentApi.getEscrow()` | `/api/v1/payment/escrow/{task_id}` | `GET` | **adapted (what changed)** | Adapts backend `{ status: "funded", reward: 4500.0, currency: "USD" }` to `EscrowPayment` with `state: "held"` and currency `INR`. |
| `profileApi.getVerifiedWork()` | `/api/v1/profile/verified-work` | `GET` | **adapted (what changed)** | Calls `/api/v1/profile/verified-work` (or downstream `/verification/me`), maps records, and computes `PortfolioSummary` stats. |
| `notificationApi.getNotifications()` | `/api/v1/notifications` | `GET` | **adapted (what changed)** | Unwraps `{ items: [...], total_unread }` and adapts each notification item to a `CbEvent` envelope. |
| `WebSocketTransport` | `/api/v1/notifications/ws` | `WS` | **adapted (what changed)** | Connects via WebSocket proxy, sends token query param, supports in-band `{ type: "auth" }`, sends `{ type: "ping" }` heartbeat, parses `notification.created` events. |

---

## 3. Mock These Services for Now

All endpoints used by the Freelancer app are mapped to real routes in `FRONTEND_CONTRACT.md`. However, in partial deployment environments where certain downstream microservices are not yet booted, use the following `VITE_MOCK_SERVICES` configurations:

| Scenario / Downstream Not Running | Recommended `VITE_MOCK_SERVICES` Value | Notes |
| :--- | :--- | :--- |
| Downstream AI Service offline (`code-context-service:8004`) | `VITE_MOCK_SERVICES=ai` | Mocks code context insights while everything else reaches the real backend. |
| Downstream Verification Service offline (`verification-service:8007`) | `VITE_MOCK_SERVICES=profile` | Mocks verified portfolio credentials while other microservices run live. |
| Downstream Payment Service offline (`payment-service:8008`) | `VITE_MOCK_SERVICES=payment` | Mocks escrow state cards. |
| AI, Payment, & Verification offline | `VITE_MOCK_SERVICES=ai,payment,profile` | Keeps core Identity, Projects, Workspaces, and Review live while mocking auxiliary microservices. |
| Fully offline / Local standalone testing | `VITE_USE_MOCKS=true` | Full MSW simulation across all services. |

---

## 4. Screens & Panels Compatibility Against Real Backend

| View / Screen | Panel / Component | Works Against Real Backend? | Required `VITE_MOCK_SERVICES` if Downstream Offline |
| :--- | :--- | :--- | :--- |
| **Task Radar** | Live Escrow Trust Badge | **Yes** (backed by `payment-service` `/payment/escrow/{id}`) | `payment` |
| **Task Radar** | GitHub Handoff Card | **Yes** (backed by `project-service` & `github-service`) | None |
| **Task Radar** | Scope & Requirements Breakdown | **Yes** (backed by `project-service` `/projects/{id}`) | None |
| **Controlled Workspace** | Docker Lifecycle Card | **Yes** (backed by `workspace-service` `/workspaces/{id}*`) | `workspace` |
| **Controlled Workspace** | Objective Test-Gate Runner | **Yes** (backed by `review-service` `/submissions/runs*`) | `submission` |
| **Controlled Workspace** | Structured Work Submission Form | **Yes** (backed by `review-service` `/submissions*`) | `submission` |
| **Verified Portfolio** | Summary Metrics & Certificate Cards | **Yes** (backed by `verification-service` `/profile/verified-work`) | `profile` |
| **Navbar / Realtime** | Live Status Pill & Notifications | **Yes** (backed by `notification-service` WS `/notifications/ws`) | `notification` |
