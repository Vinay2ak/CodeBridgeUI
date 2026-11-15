# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# ARGs for build-time env vars
ARG VITE_USE_MOCKS=false
ARG VITE_GATEWAY_URL=http://localhost:8080
ARG VITE_DASHBOARD_URL=http://localhost:5175
ARG VITE_GITHUB_MODE=off

ENV VITE_USE_MOCKS=${VITE_USE_MOCKS}
ENV VITE_GATEWAY_URL=${VITE_GATEWAY_URL}
ENV VITE_DASHBOARD_URL=${VITE_DASHBOARD_URL}
ENV VITE_GITHUB_MODE=${VITE_GITHUB_MODE}

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1
