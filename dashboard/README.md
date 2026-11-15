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

