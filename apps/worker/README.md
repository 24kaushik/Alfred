# Worker Service (`@alfred/worker`)

The Worker service is Alfred's asynchronous execution backbone. It consumes BullMQ jobs, performs long-running actions out of band, and relays model stream events to the API streaming layer.

Without this service, model calls and file ingestion would block request/response paths and significantly degrade user experience.

## Source Code Structure

```text
src/
├─ index.ts       # Worker bootstrap and queue consumer setup
├─ handler.ts     # Job handlers (chat, file processing)
├─ redis.ts       # Redis client initialization
```

Deliberate simplicity: worker focuses purely on job consumption and relay.

## Worker Boot Sequence

1. `index.ts` initializes Redis connections.
2. BullMQ queues are instantiated (`ai-queue`, `process-queue`).
3. `process()` called on each queue with handler function.
4. Worker enters listening mode.
5. On new job, handler is invoked.

## AI Queue Handler: Chat Streaming

When `ai-queue` job arrives:

```javascript
async function handleChatJob(job) {
  const { message, chatId, userId, reqId, type } = job.data;

  // 1. Choose Agent endpoint based on type
  const endpoint =
    type === "studychat" ? "/agent/study/chat" : "/agent/general/chat";

  // 2. Call Agent with streaming response
  const response = await axios.post(
    `${AGENT_URL}${endpoint}?chatId=${chatId}`,
    { message, userId },
    { responseType: "stream" },
  );

  // 3. Consume stream and relay to Redis
  response.data.on("data", (chunk) => {
    const parsed = JSON.parse(chunk.toString());
    redis.publish(`chat:${reqId}`, JSON.stringify(parsed));
  });

  // 4. Wait for stream to complete
  await new Promise((resolve, reject) => {
    response.data.on("end", resolve);
    response.data.on("error", reject);
  });

  // 5. Signal completion
  redis.publish(`chat:${reqId}`, JSON.stringify({ type: "end" }));
}
```

## Process Queue Handler: File Ingestion

When `process-queue` job arrives:

```javascript
async function handleProcessJob(job) {
  const { filePath, chatId } = job.data;

  try {
    // 1. Call Agent to process file
    const response = await axios.post(`${AGENT_URL}/file/process`, {
      filePath,
      chatId,
    });

    // 2. Log success
    console.log(`File ${filePath} processed successfully`);
  } catch (error) {
    // 3. Log failure (Agent handles DB status update)
    console.error(`File processing failed: ${error.message}`);
    throw error; // BullMQ will retry based on config
  }
}
```

## Redis Pub/Sub Relay Pattern

### Channel: `chat:${reqId}`

Worker publishes token events as they arrive from Agent:

```json
{ "type": "token", "content": "Hello" }
{ "type": "token", "content": " there" }
{ "type": "token", "content": "!" }
{ "type": "end" }
```

API subscribes to same channel and forwards events to SSE client.

### Why this architecture?

- **Decoupling**: Worker doesn't care who consumes events
- **Scalability**: Multiple SSE clients can subscribe to same channel
- **Simplicity**: Redis is simple reliable transport

## Error Handling and Retries

### BullMQ Retry Logic

```javascript
const defaultOptions = {
  attempts: 3, // retry up to 3 times
  backoff: {
    type: "exponential",
    delay: 2000, // start with 2s, exponential backoff
  },
  removeOnComplete: true, // remove job after success
};
```

If all retries exhausted:

- Job moves to failed state
- Operator can inspect and manually retry
- For chat jobs: API/browser already has timeout and error display

### Chat Job Failure

1. Agent endpoint unreachable or times out.
2. Worker catches error and publishes error event:
   ```json
   { "type": "error", "message": "Agent unavailable" }
   ```
3. API receives error and closes SSE stream.
4. Browser shows error to user.
5. User can retry chat message.

### File Job Failure

1. File not found or PDF parsing fails.
2. Worker logs error with context.
3. BullMQ retries based on config.
4. After final failure, File status stays PROCESSING (manual intervention needed) or could be set to ERROR.
5. Operator checks logs and fixes root cause.

## Why This Service Exists

AI and ingestion workloads have variable latency. A queue + worker model gives:

- stable API responsiveness
- bounded concurrency control
- retry/recovery opportunities
- clean separation of synchronous vs asynchronous responsibilities

## Responsibilities

### AI queue consumption (`ai-queue`)

- consume message jobs emitted by API
- call Agent chat endpoint
- relay token stream over Redis Pub/Sub
- publish terminal events (`end` or `error`)

### File processing queue consumption (`process-queue`)

- consume ingestion jobs emitted by API
- call Agent file processing route
- allow async file status transitions toward `PROCESSED`

### Stream relay integrity

- preserve event order
- avoid silent terminal conditions
- keep request-scoped relay keyed by `reqId`

## Queue Payload Contracts

## ai-queue payload

- `message`
- `chatId`
- `userId`
- `reqId`
- `type` (`chat` | `studychat`)

Worker expectations:

1. route to correct agent endpoint by `type`
2. stream partial tokens as pub/sub messages
3. publish terminal completion/error event

## process-queue payload

- `filePath`
- `chatId`

Worker expectations:

1. trigger file processing route in Agent
2. log success/failure with sufficient trace context
3. let downstream status fields reflect completion state

## Redis Role in Worker

Worker uses Redis for two separate concerns:

- BullMQ transport for queue consumption
- Pub/Sub event fanout to API SSE layer

This keeps infrastructure surface small while enabling real-time UX.

## Concurrency and Throughput

Current AI queue concurrency is conservative (`1`) to protect model/resource stability.

When scaling up:

- validate model limits and response quality under concurrency
- watch queue lag and event relay latency
- ensure API SSE consumers tolerate higher event rates

## Execution Narrative

### Chat streaming path

1. API enqueues `ai-queue` job.
2. Worker consumes job.
3. Worker calls Agent chat endpoint.
4. Agent streams output chunks.
5. Worker republishes chunks to Redis channel by `reqId`.
6. API receives and forwards to browser SSE.

### File processing path

1. API enqueues `process-queue` job.
2. Worker consumes job.
3. Worker calls Agent `/file/process` endpoint.
4. Agent ingests/chunks/embeds/stores vectors.
5. File status eventually reaches terminal state.

## Failure Handling Expectations

### Agent failure during chat

- emit stream `error` event
- do not emit false `end`
- include contextual logging (`chatId`, `reqId`)

### Redis instability

- queue and pub/sub paths can degrade differently
- inspect both queue connectivity and pub/sub delivery
- stale streams often indicate pub/sub side failure

### Long-running ingestion jobs

- should remain asynchronous
- should not impact API route latency
- monitor queue depth and processing duration

## Concurrency Control: Why Slow?

Current concurrency is set to `1` for `ai-queue` because:

- **Resource limits**: single Groq API account has throughput ceiling
- **Model stability**: avoid overloading Agent process
- **User experience**: predictable latency vs. unpredictable queueing

When you scale:

1. Verify Groq account allows higher concurrency.
2. Monitor Agent CPU/memory under concurrent load.
3. Test queue lag and user-perceived latency.
4. Gradually increase to `2`, `4`, `8` and measure impact.

## Queue Monitoring

### What to observe

- **Queue depth**: number of pending jobs
- **Job age**: how long oldest job has been waiting
- **Failure rate**: jobs failing vs. completing
- **Event latency**: time from AI token generation to browser receipt

### Commands to inspect queue

```bash
# List queue status (BullMQ provides UI tools in npm ecosystem)
# For now, check Redis directly:
redis-cli LLEN bull:ai-queue:wait        # pending jobs
redis-cli LLEN bull:ai-queue:active      # being processed
redis-cli LLEN bull:ai-queue:failed      # failed jobs
```

## Testing Worker Locally

1. Ensure Redis, Agent running.
2. Start worker: `pnpm --filter @alfred/worker dev`
3. Trigger chat message from frontend.
4. Worker logs show job consumption.
5. Check Redis pub/sub events: `redis-cli SUBSCRIBE chat:*`
6. Frontend SSE should display tokens.

## Environment Variables

```env
AGENT_URL=http://localhost:6767
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Runbook

### Start Worker

```bash
pnpm --filter @alfred/worker dev
```

### If chat streams are not reaching clients

- verify worker process is running
- verify queue jobs are being consumed
- verify Redis pub/sub path is healthy
- verify Agent chat endpoint response streaming

## Operational Suggestions

- include structured logs for `reqId`, `chatId`, and queue name
- add queue depth monitoring and failure-rate alerting
- consider dead-letter strategy for repeated failures

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- API orchestration and SSE bridge: [../api/README.md](../api/README.md)
- Agent execution runtime: [../agent/README.md](../agent/README.md)
- Frontend stream consumer UX: [../frontend/README.md](../frontend/README.md)
