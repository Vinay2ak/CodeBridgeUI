# CodeBridge Dashboard Micro-Frontend

This application is the central product dashboard for the CodeBridge platform, supporting three role dashboards:
- Project Owner (`/owner`)
- Freelancer (`/freelancer`)
- Platform Administrator (`/admin`)

For full architectural details, cross-app link conventions, cookie structures, and event models, consult [docs/CROSS_APP_CONTRACT.md](docs/CROSS_APP_CONTRACT.md).

---

## Getting Started

### 1. Development Server
Runs the standalone Vite application on port `5175` with strict port checking:

```bash
npm install
npm run dev
```

Visit [http://localhost:5175](http://localhost:5175).

### 2. Running Automated Tests
Executes unit and integration suites (session single-flight refresh, backoff bounds, store dedupe):

```bash
npm test
```

### 3. Production Build
Validates TypeScript strict typing and compiles optimized assets to `dist/`:

```bash
npm run build
```

---

## Containerization & Deployment

Build and run the production image using Docker and Nginx:

```bash
# Build the multi-stage image
docker build -t codebridge-dashboard .

# Run on port 8083
docker run -d -p 8083:80 --name cb-dashboard codebridge-dashboard

# Check health endpoint
curl http://localhost:8083/healthz
```

---

## Developer Tools

Press `Ctrl+Shift+D` anywhere in the dashboard to toggle the Dev Drawer:
- Inspect decoded token claims and live countdown
- Trigger token expiry or simulated account suspension
- Toggle 503 service failure on individual microservices
- Emit mock events or test connection drop and reconnection
- Live ring buffer of the last 20 API requests with correlation IDs



---

## Post Project & Developer Matching Flow

### Features
1. **Post Project Form (`/owner/projects/new`)**:
   - 3 structured cards: Problem & scope, Tech stack & specialties, Budget, timeline & verification mode.
   - Live draft autosaving via `sessionStorage` with visual indicator.
   - Automatic pre-fill from Owner Profile (`/api/v1/users/me/owner-profile`).
   - Idempotent submission via `Idempotency-Key` header.
2. **Project Detail & Recommendations (`/owner/projects/:projectId`)**:
   - Project summary card with formatted INR escrow budget.
   - Independent polling of developer matches from Talent service.
   - Interactive filtering (fits budget, available now, GitHub verified, shortlisted only).
   - Instant sorting (best match, price low-to-high, availability).
   - "Why this match" positive reason bullets and cautionary warnings.
   - Expandable 7-factor algorithm score breakdown with meters.
   - Slide-over Developer Profile Drawer with full bio and verification details.
   - One-click shortlisting with optimistic updates and server persistence.

### Testing Matching Controls in Dev Tools
Open Dev Drawer (`Ctrl+Shift+D` or bottom-left terminal icon):
- **Talent Service Simulator**: Toggle Talent 503 to test independent fallback when the Talent service is degraded.
- **Fail Matching**: Simulate matching calculation failure (`status: "failed"`).
- **Matching Delay**: Adjust artificial latency to test the "computing" polling state.
- **Emit `project.posted`**: Test real-time event propagation.

---

## Admin Analytics (Grafana Dashboard Embed)

The platform administrator area includes an embedded Grafana analytics dashboard at `/admin/analytics`, accessible by users with the `admin` role.

### Environment Variable
Configure `VITE_GRAFANA_URL` in your `.env` (never hard-coded):
```env
VITE_GRAFANA_URL=http://<backend-host>:3001/d/codebridge-analytics/codebridge-platform-analytics?orgId=1&kiosk
```

### Features & Controls
- **Time range selector**: `1 hour`, `6 hours`, `24 hours`, `7 days`, `30 days` with arrow-key radio navigation.
- **Auto-refresh**: `Off`, `30 seconds`, `1 minute`, `5 minutes`.
- **Dynamic theme synchronization**: Theme observer synchronizes light/dark mode with Grafana via `theme=dark` or `theme=light`.
- **External link**: "Open in Grafana" button launches the full Grafana dashboard in a new tab without kiosk mode.
- **Preferences persistence**: Selected time range and auto-refresh intervals persist across turns in `sessionStorage`.

### Testing the Four Connection States
1. **Not configured**:
   - Set `VITE_GRAFANA_URL=` (leave empty or unset).
   - Visit `/admin/analytics`. The page shows "Grafana is not configured" with instructions and `.env` example.
2. **Can't reach Grafana (Unreachable)**:
   - Set `VITE_GRAFANA_URL=http://127.0.0.1:9999/d/codebridge-analytics/codebridge-platform-analytics?orgId=1&kiosk` (an offline port).
   - The probe attempts connection, fails gracefully, and displays "Can't reach Grafana" with "Try again" and "Open in Grafana" buttons (no black box).
3. **Mixed content block**:
   - Serve the app over `https://` while `VITE_GRAFANA_URL` uses `http://`.
   - The page displays "The browser blocks this embed" explaining the HTTPS/HTTP mismatch.
4. **Connected / Ready**:
   - Set `VITE_GRAFANA_URL` to a running Grafana instance.
   - Status chip indicates "Connected", and the dashboard loads seamlessly in kiosk mode with matching theme.

