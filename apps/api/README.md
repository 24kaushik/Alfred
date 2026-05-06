# API Service (`@alfred/api`)

The API service is Alfred's public control plane. It owns authentication, user profile APIs, chat orchestration, study upload orchestration, and SSE delivery to the frontend.

It intentionally does not run heavy AI work directly. It validates, persists, dispatches, and streams.

## Source Code Structure

```text
src/
├─ app.ts                 # Express app initialization and middleware setup
├─ server.ts              # HTTP server bootstrap and port binding
├─ constants.ts           # Shared constants (chat types, status enums, etc.)
├─ config/
│  └─ db.config.ts        # Prisma client initialization
├─ controller/
│  ├─ auth.controller.ts  # OAuth code exchange, JWT issuance
│  ├─ user.controller.ts  # Profile and ERP credential lifecycle
│  └─ chat.controller.ts  # Chat CRUD, message send, file upload, streaming
├─ middleware/
│  ├─ errorHandler.middleware.ts  # Centralized error response formatting
│  └─ userAuth.middleware.ts      # JWT validation and user context injection
├─ router/
│  ├─ auth.route.ts       # `POST /auth/*` route bindings
│  ├─ user.route.ts       # `GET/PUT /user/*` route bindings
│  └─ chat.route.ts       # `GET/POST /chat/*` route bindings
├─ types/
│  └─ express.interface.ts # TypeScript types extending Express Request/Response
└─ utils/
   └─ ApiClasses.ts       # Custom error/response classes (ApiError, ApiResponse)
```

## How the API Boots

1. `server.ts` imports and configures Express app.
2. Middleware stack is applied in `app.ts`: CORS, cookie-parser, JSON body parsing, custom error handler.
3. Routes are registered: auth, user, chat.
4. Prisma client is lazily initialized on first DB access via `config/db.config.ts`.
5. Server binds to port and begins listening.

## Authentication Flow In Detail

### First time: user signs in with Google

1. Frontend calls `POST /api/v1/auth/google` with OAuth code.
2. `auth.controller.ts` exchanges code using Google client library.
3. Extract user email and create/upsert `Student` record in Postgres.
4. Sign JWT with student ID + email.
5. Set `authToken` cookie (HTTP-only, SameSite=Strict).
6. Return student profile and auth success.

### Subsequent requests

1. Browser automatically sends `authToken` cookie.
2. `userAuth.middleware.ts` validates JWT and extracts student ID.
3. Middleware injects student context into `req.user`.
4. Route handlers can safely assume authenticated user.

### ERP credential storage

1. User calls `PUT /api/v1/user/update` with `qid` and plaintext password.
2. Controller imports `@alfred/utils` and calls encrypt function.
3. Encrypted password is stored in `Student.erpPassword`.
4. Stored separately so API never exposes plaintext in logs or DB dumps.

## Purpose and Design Intent

The API sits between browser UX and asynchronous backend execution layers.

Its job is to:

- enforce trust boundaries
- enforce ownership boundaries
- maintain stable endpoint contracts
- dispatch expensive work to queues
- stream progress/events in real time

This keeps the frontend responsive and isolates long-running workloads to worker + agent.

## Responsibilities

### Identity and session

- Google OAuth code exchange
- JWT cookie issuance and clear/logout
- route protection with auth middleware

### User profile and ERP credentials

- fetch authenticated user profile
- store and update ERP credential data
- use shared utility package for password encryption/decryption workflows

### Chat lifecycle orchestration

- create/list standard chats
- create/list study chats
- fetch messages by chat
- accept message sends and dispatch to queue

### Study upload orchestration

- accept multipart upload for study chat
- forward upload to Agent file endpoint
- create processing queue job after successful handoff
- expose chat-scoped file status listing endpoint

## Internal and External Dependencies

- `@alfred/db`: persistence (student/chat/message/file records)
- `@alfred/queue`: queue producers (`ai-queue`, `process-queue`)
- `@alfred/redis`: pub/sub bridge for streaming
- `@alfred/utils`: encryption helpers
- network dependency: Agent service for upload and chat processing

## Endpoint Reference

Base path: `/api/v1`

### Auth

- `POST /auth/google`
- `POST /auth/logout`

### User

- `GET /user/me`
- `PUT /user/update`

### Chat

- `GET /chat`
- `GET /chat/studychats`
- `POST /chat`
- `POST /chat/studychat`
- `GET /chat/:chatId`
- `POST /chat/:chatId`
- `POST /chat/upload/:chatId`
- `GET /chat/files/:chatId`

## Runtime Flow: Message Streaming

1. Client posts message to `POST /api/v1/chat/:chatId`.
2. API validates user and chat ownership.
3. API allocates `reqId` and enqueues `ai-queue` payload.
4. API subscribes Redis channel for that `reqId`.
5. Worker publishes `token`, `end`, or `error` events.
6. API forwards those events via SSE to browser.

Why it works well:

- browser gets immediate progressive rendering
- API request thread is not blocked by LLM latency
- worker failures can be surfaced as explicit stream errors

## Chat Lifecycle: Create, Send, and Persist

### Create a new chat

1. Frontend calls `POST /api/v1/chat` or `POST /api/v1/chat/studychat`.
2. Controller creates `Chat` record with type and owner.
3. Returns newly created chat with `id`, `title`, `type`, etc.
4. Frontend can immediately start sending messages to that chat.

### Send a message (streaming path)

1. Frontend calls `POST /api/v1/chat/:chatId` with message text + optional `type` override.
2. Controller validates user owns chat.
3. Controller generates unique `reqId` (used for Redis pub/sub channel).
4. Controller enqueues `ai-queue` job:
   - payload includes message, chatId, userId, reqId, type
   - job is stored in Redis via BullMQ
5. Controller opens SSE response and subscribes to Redis channel `${reqId}`.
6. Worker picks up job and calls Agent chat endpoint.
7. Agent streams tokens; worker publishes each token as Redis event.
8. API listens and relays events to browser.
9. When stream ends, controller persists final `Message` record to Postgres.
10. SSE stream terminates gracefully.

### Fetch messages for a chat

1. Frontend calls `GET /api/v1/chat/:chatId`.
2. Controller queries `Message` records ordered by creation time.
3. Returns paginated/limited results to avoid huge payloads.
4. Frontend renders messages in thread view.

### Fetch chat list

1. Frontend calls `GET /api/v1/chat` or `GET /api/v1/chat/studychats`.
2. Controller queries user's `Chat` records filtered by type.
3. Ordered by `updatedAt` descending (newest first).
4. Frontend displays in sidebar for thread selection.

## Study File Upload and Processing Pipeline

1. Frontend calls `POST /api/v1/chat/upload/:chatId` with multipart PDF.
2. Controller validates:
   - user owns chat
   - chat type is STUDYCHAT
   - file is PDF (MIME type + extension check)
3. Controller forwards file to Agent via HTTP POST `/file/upload/:chatId`.
4. Agent temporarily stores file on disk and returns file path.
5. Controller creates `File` record in DB with status `UPLOADED`.
6. Controller enqueues `process-queue` job: `{ filePath, chatId }`.
7. Worker consumes job and calls Agent `/file/process` endpoint.
8. Agent:
   - Loads PDF from disk
   - Splits into chunks
   - Generates embeddings
   - Writes vectors to Qdrant with metadata
   - Updates `File` status to `PROCESSED` or `ERROR`
   - Deletes temp file
9. Frontend polls `GET /api/v1/chat/files/:chatId` to detect status change.
10. When `PROCESSED`, file is available for retrieval in study chat queries.

### File status lifecycle

- `UPLOADED`: file received, queued for processing
- `PROCESSING`: ingestion in progress
- `PROCESSED`: ingestion complete, vectors indexed
- `ERROR`: ingestion failed

## Runtime Flow: Study Upload

1. Client uploads file to `POST /api/v1/chat/upload/:chatId`.
2. API validates request and chat ownership.
3. API forwards file to Agent upload endpoint.
4. API persists metadata and emits `process-queue` job.
5. Worker + Agent process ingestion asynchronously.
6. Client checks status via `GET /api/v1/chat/files/:chatId`.

## Security Model

- cookie auth (`authToken`) + JWT verification middleware
- strict chat/file ownership checks before data access
- encrypted ERP password storage path
- CORS configured for expected frontend origins

## Data Model (Prisma relationships)

### Student

- `id`: unique student identifier
- `email`: from OAuth
- `qid`: Quantum University ID (optional, user-provided)
- `erpPassword`: encrypted password
- `chats`: one-to-many relationship

### Chat

- `id`: unique chat identifier
- `studentId`: foreign key to student
- `type`: `CHAT` or `STUDYCHAT`
- `title`: auto or user-defined
- `messages`: one-to-many
- `files`: one-to-many (study chats only)
- `createdAt`, `updatedAt`

### Message

- `id`: unique message identifier
- `chatId`: foreign key
- `role`: `user` or `assistant`
- `content`: message text
- `createdAt`

### File

- `id`: unique file identifier
- `chatId`: foreign key
- `originalName`: user-provided filename
- `status`: `UPLOADED` | `PROCESSING` | `PROCESSED` | `ERROR`
- `createdAt`, `updatedAt`

## Error Handling Principles

- fail early on validation and ownership mismatch
- never fake success if queue dispatch fails
- ensure SSE stream is terminated cleanly on errors
- return deterministic API errors for frontend recoverability
- always log with contextual fields (userId, chatId, reqId) for debugging

## Queue and Event Flow

### ai-queue

- **Producer**: chat.controller.ts on message send
- **Consumer**: worker service
- **Payload**: `{ message, chatId, userId, reqId, type }`
- **Result**: token events published to Redis channel `${reqId}`
- **Error handling**: worker publishes error event if agent fails

### process-queue

- **Producer**: chat.controller.ts on file upload
- **Consumer**: worker service
- **Payload**: `{ filePath, chatId }`
- **Result**: File record in DB transitions toward PROCESSED
- **Error handling**: File status set to ERROR if ingestion fails

## SSE (Server-Sent Events) Contract

API opens SSE stream to browser on chat message send. Expected events:

```
data: {"type":"token","content":"partial"}
data: {"type":"token","content":" response"}
data: {"type":"end"}
```

Or on error:

```
data: {"type":"error","message":"Agent unavailable"}
```

Browser must handle incomplete streams gracefully if connection drops.

## Middleware Stack Order

1. CORS headers injected
2. Cookie parser (parses `authToken` into `req.cookies`)
3. JSON body parser (parses `application/json`)
4. Multipart form parser for uploads
5. Custom auth middleware (validates JWT, injects `req.user`)
6. Route handlers
7. Centralized error handler (catches and formats errors)

## Environment Variables

```env
PORT=6969
NODE_ENV=development

JWT_SECRET=<required>
GOOGLE_CLIENT_ID=<required>
GOOGLE_CLIENT_SECRET=<required>

DATABASE_URL=<required>
AGENT_URL=http://localhost:6767

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Runbook

### Start API service

```bash
pnpm --filter @alfred/api dev
```

### Health check

```bash
curl http://localhost:6969/
```

### If streaming seems broken

- verify worker process is running
- verify Redis pub/sub connectivity
- verify queue jobs are being consumed
- verify Agent endpoint availability

## How to Extend Safely

- keep API thin: orchestration over heavy business logic
- keep SSE event contract backward-compatible
- keep queue payloads version-tolerant
- keep ownership checks on all chat and file routes

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Agent runtime: [../agent/README.md](../agent/README.md)
- Worker execution path: [../worker/README.md](../worker/README.md)
- Frontend client behavior: [../frontend/README.md](../frontend/README.md)
- ERP integration backend: [../erp-adapter/README.md](../erp-adapter/README.md)
