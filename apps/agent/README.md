# Agent Service (`@alfred/agent`)

The Agent service is Alfred's AI runtime brain. It executes conversational logic, calls tools, manages short-lived chat memory windows, and performs file ingestion for retrieval-augmented study responses.

API handles trust and transport. Agent handles reasoning and context assembly.

## Source Code Structure

```text
src/
├─ app.ts                     # Express app initialization
├─ server.ts                  # HTTP server bootstrap
├─ config/
│  ├─ axios.config.ts         # HTTP client config for ERP Adapter calls
│  ├─ db.config.ts            # Prisma client
│  └─ models.config.ts        # Groq LLM model initialization
├─ controller/
│  ├─ agent.controller.ts     # General + study chat endpoints
│  └─ file.controller.ts      # File upload/process/status endpoints
├─ middleware/
│  └─ errorHandler.middleware.ts
├─ routes/
│  ├─ agent.route.ts          # `/agent/*` bindings
│  └─ file.route.ts           # `/file/*` bindings
├─ agent/
│  ├─ general.agent.ts        # ERP agent logic (tools + executor)
│  └─ study.agent.ts          # Study agent logic (retrieval + tools)
├─ tools/
│  ├─ erp/
│  │  ├─ attendance.tool.ts
│  │  ├─ timetable.tool.ts
│  │  ├─ syllabus.tool.ts
│  │  └─ profile.tool.ts
│  └─ rag/
│     ├─ pqRetrieval.tool.ts  # Question paper corpus search
│     ├─ chatFiles.tool.ts    # Uploaded file retrieval per chat
│     └─ syllabus.tool.ts     # Syllabus reference tool
├─ vector/
│  ├─ chatVectorStore.ts      # Qdrant interactions for chat files
│  └─ qpVectorStore.ts        # Question paper corpus vector ops
├─ utils/
│  ├─ chatHistoryManager.ts   # Redis-backed chat memory window
│  ├─ pdfLoader.ts            # PDF parsing and chunking
│  └─ wrapToolWithUser.ts     # Tool wrapper for user context injection
└─ rag_data/
   └─ question_papers/        # Pre-indexed PYQ corpus
```

## Agent Boot Sequence

1. `server.ts` loads `.env` and initializes Groq client in `models.config.ts`.
2. Qdrant connection initialized; collections created if missing.
3. Express app configured with middleware and routes.
4. Server binds to port.
5. On first chat request, Qdrant and Redis connections are lazily tested.

## How Agents Work: LangGraph + LangChain

Both general and study agents use LangGraph state machine pattern:

1. **Input state**: `{ messages, chat_id, user_id, type }`
2. **Agent node**: calls LLM with tool descriptions and recent messages from Redis
3. **Tool invocation node**: if LLM chose a tool, call it and capture result
4. **Loop**: append assistant response + tool result to state, repeat until LLM says `stop`
5. **Output**: stream tokens to caller (worker) on each LLM chunk

## General (ERP) Agent Flow

1. Frontend sends message to study chat.
2. API/Worker calls `POST /agent/general/chat?chatId=...` with message.
3. Agent retrieves last 10 messages from Redis (chat history window).
4. Agent constructs prompt:
   ```
   You are an ERP assistant. Available tools: [attendance, timetable, profile, syllabus]
   Recent messages: [...]
   Latest user query: "..."
   ```
5. LLM decides which tool(s) to call or responds directly.
6. If tool called (e.g., `getAttendance()`), agent invokes ERP Adapter.
7. ERP Adapter returns data; agent formats for user.
8. Agent streams token chunks back to worker.
9. Worker publishes tokens to Redis Pub/Sub.
10. API forwards to browser SSE.

## Study Agent Flow

1. Frontend sends message to study chat.
2. API/Worker calls `POST /agent/study/chat?chatId=...`.
3. Agent retrieves chat history from Redis.
4. Agent constructs prompt:
   ```
   You are a study assistant. Available tools: [pqRetrieval, chatFileRetrieval, syllabus]
   Recent messages: [...]
   Latest user query: "..."
   ```
5. If user asks about uploaded files or needs examples, agent calls `chatFileRetrieval` tool.
   - Tool queries Qdrant with chat-scoped metadata filter.
   - Returns relevant chunks from uploaded PDFs.
6. If user asks about past exam patterns, agent calls `pqRetrieval` tool.
   - Tool queries corpus of indexed question papers.
7. Agent fuses retrieved context into response.
8. Streams response tokens back to worker.

## File Ingestion Pipeline (Detailed)

### Endpoint: `POST /file/upload/:chatId`

1. Receive file upload from API.
2. Store temporarily on disk with unique name.
3. Create/update `File` DB record with status `UPLOADED`.
4. Return file path to API.

### Endpoint: `POST /file/process`

1. Receive `{ filePath, chatId }` from worker.
2. Load PDF from disk using `pdfLoader.ts`.
3. PDF loader:
   - Extracts text from all pages
   - Chunks text into ~500-char semantic chunks (configurable)
   - Embeds each chunk using `Xenova/all-MiniLM-L6-v2`
4. For each chunk, upsert into Qdrant with metadata:
   ```json
   {
     "id": "chunk_${hash}",
     "text": "chunk content",
     "chat_id": "${chatId}",
     "file_id": "${fileId}",
     "page": 3
   }
   ```
5. Update File status to `PROCESSED`.
6. Delete temp file from disk.
7. Return success to worker.

### Endpoint: `GET /file/status?filePath=...`

1. Query File record by path.
2. Return current status (UPLOADED, PROCESSING, PROCESSED, ERROR).
3. Frontend polls this endpoint after upload to know when file is ready.

## Vector Store: Qdrant Collections

### `chat` collection

- Stores chunks from uploaded study files
- Scoped by `chat_id` metadata
- Prevents cross-chat leakage
- Queried during study chat responses

### `pq` collection

- Pre-indexed question paper corpus
- Loaded during agent initialization
- Global scope (not chat-specific)
- Used for exam pattern retrieval

## Redis Chat History Manager

`chatHistoryManager.ts` handles bounded message window:

1. On message send, store message in Redis key `chat:${chatId}:messages`.
2. Keep last 10 turns (configurable).
3. Set TTL of 24 hours (configurable).
4. On retrieval, fetch from Redis first (fast).
5. Fall back to DB for older messages if needed.

Benefits:

- Low latency for active chats
- Bounded token count
- Reduced DB queries

## Tool Schemas and Execution

Each tool is defined with Zod schema for validation:

```typescript
const attendanceTool = tool(
  async (input: { month?: string; year?: string }) => {
    // call ERP Adapter
    // return formatted result
  },
  {
    name: "getAttendance",
    description: "Fetch student attendance",
    schema: z.object({ month: z.string().optional() }),
  },
);
```

LangGraph executor handles tool invocation and result injection into conversation.

## Why This Service Exists

LLM orchestration and retrieval pipelines are complex, fast-evolving, and expensive. Keeping them isolated from the API service allows:

- independent iteration on prompts, tools, and model settings
- cleaner failure boundaries
- separate operational tuning for AI/retrieval workloads
- minimal coupling with user-facing transport endpoints

## Core Responsibilities

### Conversational execution

- run ERP/general chat agent
- run study-help chat agent
- stream partial token output for responsive UX

### Tool orchestration

- ERP tools (attendance, timetable, profile, syllabus)
- study tools (PYQ retrieval + chat-file retrieval)
- pass chat metadata (`chatId`) for scoped retrieval

### Context window management

- keep a bounded recent message history in Redis
- reduce repeated database pulls for hot chats
- keep prompts within practical token budgets

### File ingestion and retrieval support

- accept uploaded file records
- parse and chunk PDF content
- generate embeddings
- upsert vectors into Qdrant
- update file processing status

## Agent Modes

## 1) ERP Agent

Primary role: answer campus operational questions using ERP-backed tools.

Typical query classes:

- profile and account context
- daily/monthly/semester attendance
- timetable lookup
- syllabus inspection

## 2) Study Agent

Primary role: answer academic questions using retrieval context.

Data sources:

- question paper corpus
- uploaded study PDFs per chat
- syllabus-aware references

## Endpoint Surface

### Chat

- `POST /agent/general/chat?chatId=<uuid>`
- `POST /agent/study/chat?chatId=<uuid>`

### Admin

- `POST /agent/updateQP` (guarded by `AUTH_SECRET`)

### File

- `POST /file/upload/:chatId`
- `POST /file/process`
- `GET /file/status?filePath=...`

## Retrieval Architecture

### Storage

- Qdrant stores chunk embeddings and metadata.
- Metadata includes chat scoping fields to avoid cross-chat leakage.

### Embeddings

- Local embedding model (`Xenova/all-MiniLM-L6-v2`) balances speed and relevance for practical deployment.

### Retrieval path

- Queries apply metadata filters for the active chat.
- Retrieved chunks are fused into final model context before response synthesis.

## File Processing Pipeline

1. receive process request
2. load and extract PDF text
3. split text into chunks
4. embed each chunk
5. write vectors with metadata
6. mark file lifecycle status toward completion
7. clean temporary artifacts

## Common Failure Modes

- scanned PDFs with poor extractable text
- metadata key mismatches during filter queries
- chunk sizing that is too coarse or too fragmented
- vector write success but status not updated in DB path

When retrieval quality degrades, inspect ingestion logs and metadata first.

## Redis Memory Strategy

Agent keeps a bounded recent chat window in Redis with TTL.

Benefits:

- lower latency for active chats
- bounded context size
- reduced DB dependency during active conversations

Tradeoff:

- older context may require explicit persistent retrieval when needed.

## Model and Inference Strategy

### LLM: Groq (fast inference)

- Model: `openai/gpt-oss-120b` or similar
- Streaming enabled for token-by-token output
- Temperature tuned for balance of creativity and consistency

### Embeddings: Local transformer

- Model: `Xenova/all-MiniLM-L6-v2` (small, fast, good quality)
- Runs locally without external API calls
- ~384 dimensional vectors

## Failure Modes and Debugging

### Chat stream stops without end

- Check worker logs for error events
- Verify Agent HTTP response isn't malformed
- Verify Groq API key and rate limits

### File ingestion stuck in PROCESSING

- Check Agent logs for PDF parsing errors
- Verify Qdrant connectivity
- Verify disk space for temp file

### Retrieval returns no results

- Verify file status is PROCESSED (not PROCESSING or ERROR)
- Verify metadata filter in chatFileRetrieval tool matches ingestion
- Check Qdrant collection exists and has vectors

### Tool calls fail

- Verify ERP Adapter is running
- Verify tool schemas match actual parameters
- Check LLM prompt for clarity

## Environment Variables

```env
PORT=6767
NODE_ENV=development

AUTH_SECRET=<required-for-updateQP>
GROQ_API_KEY=<required>

ERP_URL=http://localhost:6868
QDRANT_URL=http://localhost:6333

DATABASE_URL=<required>
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Runbook

### Start Agent

```bash
pnpm --filter @alfred/agent dev
```

### Health check

```bash
curl http://localhost:6767/
```

### If responses are weak or empty

- verify file status reaches `PROCESSED`
- verify vector metadata uses expected chat scoping key
- verify embedding pipeline is writing into expected collection
- verify retrieval filters align with ingestion metadata shape

## Safe Extension Guidelines

- keep tool schemas explicit and validated
- keep streaming contracts predictable for worker/API relay
- keep retrieval metadata contract stable across versions
- add diagnostics before changing chunking or embedding strategy

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- API orchestration layer: [../api/README.md](../api/README.md)
- Worker stream relay: [../worker/README.md](../worker/README.md)
- ERP Adapter source integration: [../erp-adapter/README.md](../erp-adapter/README.md)
- Frontend chat UX: [../frontend/README.md](../frontend/README.md)
