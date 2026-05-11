# =========================================================
# BASE
# =========================================================

FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

RUN pnpm config set ignore-scripts false
RUN pnpm config set fetch-retries 10
RUN pnpm config set fetch-retry-factor 2
RUN pnpm config set fetch-timeout 600000
RUN pnpm config set network-timeout 600000
RUN pnpm config set child-concurrency 2
RUN pnpm config set network-concurrency 4

COPY . .

# =========================================================
# API BUILD
# =========================================================

FROM base AS api-build

RUN pnpm install --filter @alfred/api... --frozen-lockfile

RUN pnpm --filter @alfred/db generate

RUN pnpm --filter @alfred/db build
RUN pnpm --filter @alfred/utils build
RUN pnpm --filter @alfred/redis build
RUN pnpm --filter @alfred/queue build

RUN pnpm --filter @alfred/api build

# Store migration files info for runtime (migrations will run when app starts)
RUN mkdir -p /prisma-info && \
  cp -r packages/db/prisma/migrations /prisma-info/ 2>/dev/null || true

# =========================================================
# API RUNTIME
# =========================================================

FROM node:22-slim AS api

ENV NODE_ENV=production

WORKDIR /app

COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/apps/api/node_modules ./apps/api/node_modules

COPY --from=api-build /app/apps/api/dist ./apps/api/dist
COPY --from=api-build /app/apps/api/package.json ./apps/api/package.json

COPY --from=api-build /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=api-build /app/packages/db/dist ./packages/db/dist
COPY --from=api-build /app/packages/db/package.json ./packages/db/package.json
COPY --from=api-build /app/packages/db/prisma ./packages/db/prisma

COPY --from=api-build /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=api-build /app/packages/utils/dist ./packages/utils/dist
COPY --from=api-build /app/packages/utils/package.json ./packages/utils/package.json

COPY --from=api-build /app/packages/redis/node_modules ./packages/redis/node_modules
COPY --from=api-build /app/packages/redis/dist ./packages/redis/dist
COPY --from=api-build /app/packages/redis/package.json ./packages/redis/package.json

COPY --from=api-build /app/packages/queue/node_modules ./packages/queue/node_modules
COPY --from=api-build /app/packages/queue/dist ./packages/queue/dist
COPY --from=api-build /app/packages/queue/package.json ./packages/queue/package.json

COPY --from=api-build /app/package.json ./package.json

COPY --from=api-build /app/docker/start-api.sh ./docker/start-api.sh

EXPOSE 6969

CMD ["sh", "docker/start-api.sh"]

# =========================================================
# AGENT BUILD
# =========================================================

FROM base AS agent-build

RUN pnpm install --filter @alfred/agent... --frozen-lockfile

RUN pnpm --filter @alfred/db generate

RUN pnpm --filter @alfred/db build
RUN pnpm --filter @alfred/utils build
RUN pnpm --filter @alfred/redis build

RUN pnpm --filter @alfred/agent build

# =========================================================
# AGENT RUNTIME
# =========================================================

FROM node:22-slim AS agent

ENV NODE_ENV=production

WORKDIR /app

COPY --from=agent-build /app/node_modules ./node_modules
COPY --from=agent-build /app/apps/agent/node_modules ./apps/agent/node_modules

COPY --from=agent-build /app/apps/agent/dist ./apps/agent/dist
COPY --from=agent-build /app/apps/agent/package.json ./apps/agent/package.json

COPY --from=agent-build /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=agent-build /app/packages/db/dist ./packages/db/dist
COPY --from=agent-build /app/packages/db/package.json ./packages/db/package.json
COPY --from=agent-build /app/packages/db/prisma ./packages/db/prisma

COPY --from=agent-build /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=agent-build /app/packages/utils/dist ./packages/utils/dist
COPY --from=agent-build /app/packages/utils/package.json ./packages/utils/package.json

COPY --from=agent-build /app/packages/redis/node_modules ./packages/redis/node_modules
COPY --from=agent-build /app/packages/redis/dist ./packages/redis/dist
COPY --from=agent-build /app/packages/redis/package.json ./packages/redis/package.json

COPY --from=agent-build /app/packages/queue/node_modules ./packages/queue/node_modules
COPY --from=agent-build /app/packages/queue/dist ./packages/queue/dist
COPY --from=agent-build /app/packages/queue/package.json ./packages/queue/package.json

EXPOSE 6767

CMD ["node", "apps/agent/dist/server.js"]

# =========================================================
# ERP BUILD
# =========================================================

FROM base AS erp-build

RUN pnpm install --filter @alfred/erp-adapter... --frozen-lockfile

RUN pnpm --filter @alfred/db generate

RUN pnpm --filter @alfred/db build
RUN pnpm --filter @alfred/utils build
RUN pnpm --filter @alfred/redis build

RUN pnpm --filter @alfred/erp-adapter build

# =========================================================
# ERP RUNTIME
# =========================================================

FROM node:22-slim AS erp

ENV NODE_ENV=production

WORKDIR /app

COPY --from=erp-build /app/node_modules ./node_modules
COPY --from=erp-build /app/apps/erp-adapter/node_modules ./apps/erp-adapter/node_modules

COPY --from=erp-build /app/apps/erp-adapter/dist ./apps/erp-adapter/dist
COPY --from=erp-build /app/apps/erp-adapter/package.json ./apps/erp-adapter/package.json

COPY --from=erp-build /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=erp-build /app/packages/db/dist ./packages/db/dist
COPY --from=erp-build /app/packages/db/package.json ./packages/db/package.json
COPY --from=erp-build /app/packages/db/prisma ./packages/db/prisma

COPY --from=erp-build /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=erp-build /app/packages/utils/dist ./packages/utils/dist
COPY --from=erp-build /app/packages/utils/package.json ./packages/utils/package.json

COPY --from=erp-build /app/packages/redis/node_modules ./packages/redis/node_modules
COPY --from=erp-build /app/packages/redis/dist ./packages/redis/dist
COPY --from=erp-build /app/packages/redis/package.json ./packages/redis/package.json

COPY --from=erp-build /app/packages/queue/node_modules ./packages/queue/node_modules
COPY --from=erp-build /app/packages/queue/dist ./packages/queue/dist
COPY --from=erp-build /app/packages/queue/package.json ./packages/queue/package.json

EXPOSE 6868

CMD ["node", "apps/erp-adapter/dist/server.js"]

# =========================================================
# WORKER BUILD
# =========================================================

FROM base AS worker-build

RUN pnpm install --filter @alfred/worker... --frozen-lockfile

RUN pnpm --filter @alfred/redis build
RUN pnpm --filter @alfred/queue build

RUN pnpm --filter @alfred/worker build

# =========================================================
# WORKER RUNTIME
# =========================================================

FROM node:22-slim AS worker

ENV NODE_ENV=production

WORKDIR /app

COPY --from=worker-build /app/node_modules ./node_modules
COPY --from=worker-build /app/apps/worker/node_modules ./apps/worker/node_modules

COPY --from=worker-build /app/apps/worker/dist ./apps/worker/dist
COPY --from=worker-build /app/apps/worker/package.json ./apps/worker/package.json

COPY --from=worker-build /app/packages/queue/dist ./packages/queue/dist
COPY --from=worker-build /app/packages/queue/package.json ./packages/queue/package.json

COPY --from=worker-build /app/packages/redis/dist ./packages/redis/dist
COPY --from=worker-build /app/packages/redis/package.json ./packages/redis/package.json

COPY --from=worker-build /app/package.json ./package.json

CMD ["node", "apps/worker/dist/index.js"]

# =========================================================
# FRONTEND BUILD
# =========================================================

FROM base AS frontend-build

COPY .env.docker.frontend apps/frontend/.env

RUN pnpm install --filter @alfred/frontend... --frozen-lockfile

RUN pnpm --filter @alfred/frontend build

# =========================================================
# FRONTEND RUNTIME
# =========================================================

FROM nginx:alpine AS frontend

COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80