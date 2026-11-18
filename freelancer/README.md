# CodeBridge Freelancer Developer Workspace (Parts A & B)

Standalone frontend single-page application for CodeBridge freelancers to inspect task specifications, view simulated AI context, follow timeline activities, observe isolated Docker workspace status, edit files in a syntax-highlighted code workspace, run test suites with live streaming progress, interact with an in-browser workspace terminal, track escrow payment progression, and submit solutions for client verification.

---

## Quick Start

### 1. Installation & Local Development
```powershell
Set-Location d:\CodeFreelancer\freelancer
npm install
npm run dev
```

The application runs on **port 5177** (`http://localhost:5177`).

### 2. Demo User Role Shortcut (`?role=`)
To quickly authenticate without the external Identity service in mock mode:
- **Freelancer Workspace**: `http://localhost:5177/?role=freelancer` (Auto-logs in as Ravi Freelancer and selects the active task).
- **Owner Redirect**: `http://localhost:5177/?role=owner` (Navigates to `${VITE_DASHBOARD_URL}/owner`).
- **Admin Redirect**: `http://localhost:5177/?role=admin` (Navigates to `${VITE_DASHBOARD_URL}/admin`).

The query parameter is stripped immediately using `history.replaceState` after bootstrapping the `mock_rt` cookie.

---

## Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + S` | Save active file changes in the code editor. |
| `Ctrl + Enter` | Trigger automated test verification suite in the dock. |
| `Ctrl + \`` | Focus the workspace terminal command input prompt. |
| `Ctrl + Shift + D` | Toggle the developer diagnostics side drawer. |
| `Esc` | Leave code editor mode or dismiss modal dialogs. |

---

## Select Component

Accessible, custom frosted-glass combobox component complying with the WAI-ARIA select-only pattern.

### API
```tsx
<Select
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  options: SelectOption[] // { value, label, description?, disabled?, tone?: "success" | "primary" | "muted" }
  placeholder?: string     // Default "Select…"
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  size?: "md" | "sm"       // "md" (40px) or "sm" (32px)
  aria-label?: string
  aria-labelledby?: string
  aria-describedby?: string
  className?: string
/>
```

### Keyboard Shortcuts (Focus on Trigger)
| Key | Action |
| :--- | :--- |
| `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Open popover (when closed). |
| `ArrowDown` / `ArrowUp` | Move active option with boundary clamping (skips disabled). |
| `Home` / `End` | Jump to first / last enabled option. |
| `PageUp` / `PageDown` | Jump 10 enabled options up / down. |
| `Enter` / `Space` | Select active option and close popover. |
| `Tab` | Select active option and advance focus to next focusable element. |
| `Escape` | Dismiss popover without selecting (preserves parent dialogs). |
| Printable characters | 500ms typeahead buffer (case-insensitive prefix match & cycling). |

---

## Testing & Production Build

### Vitest Test Suite (Single Run)
```powershell
npx vitest run
```
Runs:
- WCAG theme contrast verification ($\ge 4.5:1$ text and $\ge 3:1$ controls)
- AST/file guard against color literals and default Tailwind palettes
- Session refresh coalescing tests (5 parallel 401s $\rightarrow$ 1 refresh)
- Realtime backoff and event store deduplication tests
- Submission gate state verification (9 test cases)
- Terminal command parser & execution tests (7 test cases)

### Production Build
```powershell
npm run build
```
Typechecks via `tsc -b` and bundles production assets via Vite into `dist/`.

---

## Mock Simulation Controls (`window.__cbMock`)

In local development with `VITE_USE_MOCKS=true`, the developer console exposes `window.__cbMock`:

| Command | Description |
| :--- | :--- |
| `window.__cbMock.expireToken()` | Forces the current access token to be considered expired on the next API call, exercising single-flight `/auth/refresh` replay. |
| `window.__cbMock.setSuspended(true)` | Simulates account suspension triggering the full-screen `SuspendedScreen`. |
| `window.__cbMock.serviceDown("ai", true)` | Simulates 503 Service Unavailable on the AI context service to verify isolated error boundary & retry behavior. |
| `window.__cbMock.serviceDown("payment", true)` | Simulates 503 on the escrow payment service without breaking coding or workspace controls. |
| `window.__cbMock.serviceDown("workspace", true)` | Simulates 503 on the workspace management service. |
| `window.__cbMock.serviceDown("submission", true)` | Simulates 503 on the submission & test runner service. |
| `window.__cbMock.emitEvent(type, data)` | Dispatches a realtime event envelope over the `BroadcastChannel("cb-events")` and internal event store. |
| `window.__cbMock.dropConnection(ms)` | Simulates network drop and shows reconnecting countdown on the LivePill. |
| `window.__cbMock.applyReferenceFix("t1")` | Loads the reference fix code into mock files to satisfy all test rules. |
| `window.__cbMock.simulateOwnerDecision("t1", "approve")` | Dispatches owner acceptance and payment release events. |
| `window.__cbMock.simulateOwnerDecision("t1", "changes")` | Dispatches reviewer changes requested event and makes the test run stale. |
| `window.__cbMock.resetTask("t1")` | Restores files, run state, and task status to initial snapshot. |

---

## Docker Packaging

### Build Docker Image
```bash
docker build -t codebridge-freelancer:latest .
```

### Run Container
```bash
docker run -d --name codebridge-freelancer -p 8085:80 codebridge-freelancer:latest
```

- Application URL: `http://localhost:8085`
- Health check endpoint: `http://localhost:8085/healthz` (Returns `200 ok`)

---

## Architectural Contracts
See [docs/CROSS_APP_CONTRACT.md](file:///d:/CodeFreelancer/freelancer/docs/CROSS_APP_CONTRACT.md) for full cross-app navigation rules, cookie formats, session lifecycles, and realtime WebSocket event envelopes.
