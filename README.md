# Alfred

<p align="center">
  <b>AI Copilot for Campus Life</b><br />
  Built for real student workflows at Quantum University.
</p>

<p align="center">
  <a href="https://github.com/24kaushik/Alfred">Repository</a> •
  <a href="https://github.com/24kaushik/Alfred/issues">Issues</a> •
  <a href="./LICENSE">License</a>
</p>

[![Monorepo](https://img.shields.io/badge/architecture-modular--monolith-0f172a)](./README.md)
[![Workspace](https://img.shields.io/badge/workspace-pnpm-f59e0b)](./pnpm-workspace.yaml)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6)](./tsconfig.base.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a)](./LICENSE)

Alfred is a pnpm-workspace modular monolith that combines authentication, ERP automation, AI chat, study-document retrieval, and asynchronous job processing in one cohesive codebase.

This project is designed and built by Kaushik Sarkar, with love, tears, and many late-night debugging sessions.

## Table of Contents

- [Why Alfred Exists](#why-alfred-exists)
- [System Highlights](#system-highlights)
- [Monorepo Structure](#monorepo-structure)
- [Architecture Philosophy](#architecture-philosophy)
- [End-to-End Runtime Flows](#end-to-end-runtime-flows)
- [Service-by-Service Overview](#service-by-service-overview)
- [Shared Package Overview](#shared-package-overview)
- [Tech Stack](#tech-stack)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Operations and Troubleshooting](#operations-and-troubleshooting)
- [Documentation Index](#documentation-index)
- [Author](#author)
- [License](#license)

## Why Alfred Exists

Campus systems are fragmented. Students juggle multiple portals, repetitive flows, and disconnected study resources.

Alfred unifies that experience:

- one assistant for day-to-day ERP actions
- one study copilot for uploaded notes and PYQ retrieval
- one architecture that stays fast to ship and easy to evolve

## System Highlights

- Modular monolith architecture with strict app boundaries
- Shared internal packages for data, queueing, Redis, and utilities
- Google OAuth login and JWT cookie session flow
- ERP adapter with captcha OCR pipeline and cookie caching
- Streaming AI chat over SSE with Redis pub/sub bridge
- Study chat with PDF upload, vector indexing, and retrieval grounding
- Worker-driven asynchronous processing via BullMQ

## Monorepo Structure

```text
.
├─ apps/
│  ├─ frontend/      # React + Vite interface
│  ├─ api/           # Main public API gateway
│  ├─ worker/        # BullMQ consumers and streaming relay
│  ├─ agent/         # LLM orchestration and RAG runtime
│  └─ erp-adapter/   # QUMS integration + captcha solve pipeline
├─ packages/
│  ├─ db/            # Prisma schema and client
│  ├─ queue/         # Queue producers and contracts
│  ├─ redis/         # Shared Redis client creation
│  └─ utils/         # Encryption/decryption and shared helpers
├─ package.json
├─ pnpm-workspace.yaml
└─ LICENSE
```

## Architecture Philosophy

Alfred deliberately avoids early multi-repo microservice sprawl. Instead, it uses modular monolith principles:

- keep boundaries strict
- keep contracts explicit (HTTP, queue payloads, Prisma models)
- keep shared logic in packages, not copy-pasted across apps
- keep local developer experience simple

This gives strong modularity without distributed-system drag.

## End-to-End Runtime Flows

### 1) Authentication and Session Bootstrap

1. Frontend initiates Google OAuth.
2. API verifies OAuth code and upserts student record.
3. API issues `authToken` as cookie.
4. Protected routes use JWT middleware.
5. ERP credentials are encrypted before persistence.

### 2) General and Study Chat Streaming

1. Frontend sends message to `POST /api/v1/chat/:chatId`.
2. API validates ownership and emits an `ai-queue` job.
3. Worker consumes job and calls Agent chat endpoint.
4. Agent streams token chunks.
5. Worker republishes chunks over Redis Pub/Sub (`reqId`).
6. API streams these events to browser via SSE.

### 3) Study File Upload and Ingestion

1. Frontend uploads PDF via `POST /api/v1/chat/upload/:chatId`.
2. API forwards file to Agent and stores metadata.
3. API emits `process-queue` job.
4. Worker triggers Agent processing.
5. Agent parses, chunks, embeds, and writes vectors to Qdrant.
6. File status transitions toward `PROCESSED`.

### 4) ERP Data Access

1. Agent tools call ERP Adapter.
2. Adapter uses Redis cookie cache when available.
3. On cache miss, adapter executes captcha login OCR flow.
4. Adapter normalizes ERP payloads before returning data.

## Service-by-Service Overview

### apps/frontend ([Readme](./apps/frontend/README.md))

Owns UX for login, thread management, streaming render, and study file interactions.

### apps/api ([Readme](./apps/api/README.md))

Owns authentication, chat orchestration, upload handoff, SSE bridge, and queue production.

### apps/worker ([Readme](./apps/worker/README.md))

Owns asynchronous execution reliability: chat jobs, file jobs, and token relay.

### apps/agent ([Readme](./apps/agent/README.md))

Owns LLM runtime, tool orchestration, retrieval, and document ingestion.

### apps/erp-adapter ([Readme](./apps/erp-adapter/README.md))

Owns QUMS compatibility: login, captcha OCR, cookie caching, and normalized ERP APIs.

## Shared Package Overview

### packages/db (`@alfred/db`)

Prisma schema, migrations, and generated client.

### packages/queue (`@alfred/queue`)

Queue names and producer contracts for async tasks.

### packages/redis (`@alfred/redis`)

Shared Redis client factory for API, worker, agent, and adapter.

### packages/utils (`@alfred/utils`)

Cross-service utilities, including encryption/decryption helpers.

## Tech Stack

- Runtime: Node.js + TypeScript
- Monorepo: pnpm workspace
- Frontend: React 19, Vite, Tailwind
- API: Express 5
- Database: PostgreSQL + Prisma, Qdrant vector store
- Cache/Streams: Redis (KV + Pub/Sub)
- Queueing: BullMQ
- AI: LangChain, LangGraph, Groq
- Retrieval: Qdrant + embedding pipeline
- OCR: Sharp + Tesseract.js

## Environment Configuration

Root backend env:

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/alfred
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT_SECRET=change-this
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

ENCRYPTION_ALGORITHM=aes-256-cbc
ENCRYPTION_KEY=<64-char-hex-key>

AGENT_URL=http://localhost:6767
ERP_URL=http://localhost:6868
QDRANT_URL=http://localhost:6333

AUTH_SECRET=<agent-admin-secret>
GROQ_API_KEY=<required>
TESSERACT_POOL_SIZE=4
```

Frontend env (`apps/frontend/.env`):

```env
VITE_API_URL=http://localhost:6969
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

## Local Development

```bash
pnpm install
pnpm --filter @alfred/db generate
pnpm --filter @alfred/db dev:migrate
pnpm dev
```

Run individual services:

```bash
pnpm dev:frontend
pnpm dev:api
pnpm dev:worker
pnpm dev:agent
pnpm dev:erp-adapter
```

## Operations and Troubleshooting

- Stream stalled: verify worker process and Redis pub/sub connectivity.
- Upload never processed: verify `process-queue` consumer and agent logs.
- ERP calls flaky: verify OCR dependencies and login retry path.
- Auth failing in browser: verify CORS and cookie settings.

## Documentation Index

### App READMEs

- [Frontend README](./apps/frontend/README.md)
- [API README](./apps/api/README.md)
- [Worker README](./apps/worker/README.md)
- [Agent README](./apps/agent/README.md)
- [ERP Adapter README](./apps/erp-adapter/README.md)

### Shared Packages

- [packages/db](./packages/db)
- [packages/queue](./packages/queue)
- [packages/redis](./packages/redis)
- [packages/utils](./packages/utils)

## Author

Built by **Kaushik Sarkar**.

Made with love, tears, and stubborn persistence.

## License

Licensed under the MIT License.

See [LICENSE](./LICENSE) for full text.
