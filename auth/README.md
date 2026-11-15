# CodeBridge Auth App

Standalone authentication and onboarding frontend for CodeBridge (`/login` and `/register`), built with React, TypeScript, Vite, Tailwind CSS, React Hook Form, Zod, TanStack Query, and MSW v2.

## Quick Start

```bash
npm install
npm run dev        # starts dev server on http://localhost:5173
```

Build & test:

```bash
npm run build      # type-checks (tsc -b) and builds production bundle
npx vitest run     # runs unit tests
```

## Environment Variables

Copy `.env.example` to `.env` for local development.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_USE_MOCKS` | `false` (`true` in `.env.example`) | Set to `"true"` to enable MSW v2 browser mocks instead of calling the API gateway. |
| `VITE_GATEWAY_URL` | `http://localhost:8080` | API gateway base URL (used when `VITE_USE_MOCKS=false`; proxied under `/api` in dev). |
| `VITE_DASHBOARD_URL` | `http://localhost:5175` | Dashboard app URL used for cross-app redirects after authentication/onboarding. |
| `VITE_GITHUB_MODE` | `"mock"` if `VITE_USE_MOCKS=true`, else `"off"` | Controls GitHub linking UI (`"mock"` for simulated link, `"off"` to hide until live). |
| `VITE_BASE_PATH` | `/` | Vite base public path when serving under a subpath. |

## Testing Flows (Mock Mode)

Ensure `VITE_USE_MOCKS=true` in `.env`, then start the dev server (`npm run dev`).

### Tracks

- **Owner track**: open `/register` or `/register?role=owner`, create an account (Step 0), and complete the 3 owner onboarding steps.
- **Freelancer track**: open `/register?role=freelancer`, create an account (Step 0), and complete the 3 freelancer onboarding steps (including optional mock GitHub linking).
- **Resume onboarding**: open `/login` and sign in with `newowner@demo.dev` or `newfreelancer@demo.dev` (any non-empty password) to trigger the `onboardingCompleted === false` gate and resume at `/register?resume=1`.

### Demo Error Triggers

| Email | Endpoint | Result |
| --- | --- | --- |
| `taken@demo.dev` | `POST /auth/register` | `409 Conflict` (`EMAIL_TAKEN`) |
| `limited@demo.dev` | `POST /auth/login` or `POST /auth/register` | `429 Too Many Requests` (`RATE_LIMITED`, `Retry-After: 10`) |
| `down@demo.dev` | `POST /auth/login` or `POST /auth/register` | `503 Service Unavailable` (`SERVICE_UNAVAILABLE`) |
| `suspended@demo.dev` | `POST /auth/login` | `403 Forbidden` (`ACCOUNT_SUSPENDED`) |

### Dev Console Helpers

When `import.meta.env.DEV && VITE_USE_MOCKS === "true"`, `window.__cbMock` is exposed in the browser console:

```js
// Simulate an upstream service outage (503) or restore it
window.__cbMock.serviceDown("identity" | "talent" | "github", true | false);

// Force the next form submission to return a 422 validation error on a field
window.__cbMock.forceFieldError("<fieldName>");
```

## Docker Packaging

`Dockerfile`, `nginx.conf`, and `.dockerignore` build a static Nginx container serving the SPA on port `80` with a `/healthz` health check endpoint (`200 ok`).

```bash
docker build -t codebridge-auth .
docker run -p 8080:80 codebridge-auth
```

Verify health:

```bash
curl http://localhost:8080/healthz
```
