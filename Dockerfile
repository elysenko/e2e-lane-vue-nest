# syntax=docker/dockerfile:1
#
# Combined nginx + supervisord container for Vue + NestJS full-stack app.
# - Stage 1: build Vue/Vite frontend  -> /app/web/dist
# - Stage 2: build NestJS backend     -> /app/backend/dist + prisma client
# - Stage 3: runtime with nginx + supervisord + backend node app
#
# Frontend is served at / by nginx; /api/ is proxied to the NestJS backend on 127.0.0.1:3000.

# ---------- Frontend build stage ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --loglevel=error || \
    npm install --no-audit --no-fund --loglevel=error
COPY web/ ./
RUN npx vite build

# ---------- Backend build stage ----------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache openssl
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund --loglevel=error || \
    npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error
COPY backend/ ./
RUN npx prisma generate
RUN npm run build && \
    test -n "$(find /app/backend/dist -name main.js | head -1)" || \
    (echo 'ERROR: no main.js in dist — check tsconfig rootDir' && exit 1)

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache nginx supervisor openssl bash
WORKDIR /app

# Backend runtime — copy everything so ts-node/node_modules/prisma live together
COPY --from=backend-builder /app/backend /app/backend

# Frontend static assets -> nginx docroot
RUN mkdir -p /usr/share/nginx/html
COPY --from=frontend-builder /app/web/dist /usr/share/nginx/html

# nginx site config
COPY nginx.conf /etc/nginx/http.d/default.conf

# supervisord config
COPY supervisord.conf /etc/supervisord.conf

# Ensure supervisor runtime dirs exist and are writable
RUN mkdir -p /run/nginx /var/log/nginx /tmp && \
    chmod -R 777 /run/nginx /var/log/nginx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
