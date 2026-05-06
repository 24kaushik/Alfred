# ERP Adapter (`@alfred/erp-adapter`)

The ERP Adapter is Alfred's external-system compatibility layer for QUMS. It handles login choreography, captcha OCR, session caching, and normalized endpoint responses.

Its main value is turning an unstable upstream experience into a stable internal contract.

## Source Code Structure

```text
src/
├─ app.ts                    # Express app setup
├─ server.ts                 # HTTP server bootstrap
├─ config/
│  ├─ axios.config.ts        # HTTP client for QUMS
│  └─ db.config.ts           # Prisma client
├─ controller/
│  ├─ attendance.controller.ts
│  ├─ circular.controller.ts
│  ├─ general.controller.ts  # Profile endpoints
│  └─ timetable.controller.ts
├─ middleware/
│  └─ errorHandler.middleware.ts
├─ normalizer/               # Response shape transformation
│  ├─ attendance.normalizer.ts
│  ├─ timetable.normalizer.ts
│  └─ general.normalizer.ts
├─ router/                   # Route registration
├─ service/                  # Business logic (login, OCR, caching)
│  └─ erp.service.ts         # Main ERP interaction flow
└─ utils/                    # Helpers
```

## ERP Service Boot Sequence

1. `server.ts` initializes HTTP client in `axios.config.ts`.
2. Prisma client created for student credential lookup.
3. Express routes registered.
4. Server binds to port.
5. On first ERP call, Redis connection tested.

## Login and Captcha OCR Pipeline (Detailed)

### Step 1: Fetch Login Page and Tokens

```javascript
const loginPageResponse = await axios.get(
  "https://qums.quantumuniversity.edu.in/login",
);

// Extract anti-forgery token from HTML
const token = extractTokenFromHTML(loginPageResponse.data);
```

### Step 2: Fetch Captcha Image

```javascript
const captchaResponse = await axios.get(
  "https://qums.quantumuniversity.edu.in/captcha",
  { responseType: "arraybuffer" },
);

const captchaBuffer = Buffer.from(captchaResponse.data);
```

### Step 3: Preprocess Image for OCR

```javascript
const image = await sharp(captchaBuffer)
  .grayscale() // Convert to grayscale
  .normalize() // Normalize contrast
  .png()
  .toBuffer();
```

### Step 4: OCR Decode

```javascript
const {
  data: { text },
} = await Tesseract.recognize(image, "eng", {
  logger: (msg) => console.log(msg),
});

const captchaText = text.trim();
```

### Step 5: Submit Login

```javascript
const loginResponse = await axios.post(
  "https://qums.quantumuniversity.edu.in/login",
  {
    qid: studentQid,
    password: studentPassword,
    captcha: captchaText,
    token: antiForgerToken,
  },
  {
    validateStatus: () => true, // capture all status codes
  },
);

if (loginResponse.status === 200 && isLoggedIn(loginResponse)) {
  // Extract cookies
  const cookies = parseCookieHeader(loginResponse.headers["set-cookie"]);
  return cookies; // will cache in Redis
}
```

### Step 6: Retry on OCR Mismatch

```javascript
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    return await attemptLogin();
  } catch (error) {
    if (error.message.includes("captcha")) {
      retries++;
      console.log(`OCR failed, retry ${retries}/${maxRetries}`);
      // Loop back and try again
    } else {
      throw error; // other error, don't retry
    }
  }
}

throw new Error("Captcha decode failed after 3 attempts");
```

## Cookie Caching Strategy (Redis)

### Cache Key Format

```
erp:cookies:${studentId}
```

### Cache Lifecycle

1. **First call**: Redis cache miss → execute login pipeline → store cookies with TTL (8 hours).
2. **Subsequent calls within 8 hours**: Cache hit → use cookies directly.
3. **After 8 hours**: Cache expired → execute login again → refresh cache.

### Fallback on Cache Stale

```javascript
async function getCookies(studentId) {
  // 1. Try Redis cache
  let cookies = await redis.get(`erp:cookies:${studentId}`);

  if (cookies) {
    return JSON.parse(cookies); // cache hit
  }

  // 2. Cache miss → run login
  cookies = await login(studentId);

  // 3. Store in cache with TTL
  await redis.setex(
    `erp:cookies:${studentId}`,
    8 * 60 * 60, // 8 hours
    JSON.stringify(cookies),
  );

  return cookies;
}
```

## Data Endpoint Patterns

### Attendance Retrieval

```javascript
// Route: GET /attendance/monthly?month=5&year=2024

async function getMonthlyAttendance(req, res) {
  // 1. Get student credentials
  const student = await prisma.student.findUnique({
    where: { id: req.user.id },
  });

  // 2. Get ERP cookies
  const cookies = await getCookies(student.id);

  // 3. Call QUMS endpoint
  const response = await axios.get(
    "https://qums.quantumuniversity.edu.in/api/attendance",
    {
      params: { month: req.query.month, year: req.query.year },
      headers: { Cookie: formatCookies(cookies) },
    },
  );

  // 4. Normalize response
  const normalized = normalizeAttendance(response.data);

  // 5. Return
  res.json(normalized);
}
```

### Response Normalization Example

Raw QUMS response (inconsistent schema):

```json
{
  "attendance_records": [
    { "sub_id": "CS101", "pct": "85.5" },
    { "sub_id": "CS102", "pct": "92.0" }
  ]
}
```

Normalized response (predictable schema):

```json
{
  "attendance": [
    { "subjectId": "CS101", "percentage": 85.5 },
    { "subjectId": "CS102", "percentage": 92.0 }
  ]
}
```

## Why This Service Exists

Directly coupling AI tools to raw ERP behavior would cause fragile responses and repeated breakages.

This service isolates that risk by centralizing:

- portal login logic
- captcha solve pipeline
- session cookie reuse
- response normalization

When ERP behavior changes, fixes should mostly stay here.

## Core Responsibilities

### Authentication and session lifecycle

- fetch login tokens
- download captcha image
- preprocess image for OCR
- decode captcha via Tesseract.js
- submit credentials and establish session
- cache session cookies in Redis

### Data endpoint adaptation

- attendance (daily, monthly, semester)
- timetable
- circulars
- general/profile details
- syllabus

### Contract normalization

- convert ERP-specific payload noise into predictable structures
- keep downstream tools simple and resilient

## Captcha and Login Pipeline

1. Fetch ERP login page.
2. Extract anti-forgery token(s).
3. Fetch captcha image.
4. Enhance image with Sharp.
5. OCR text using Tesseract.js.
6. Submit login form with QID/password/captcha.
7. On success, cache cookie set in Redis.
8. Reuse cached cookies until invalid/expired.

Retry logic handles expected OCR mismatch scenarios.

## Cookie Caching Strategy

Adapter first checks Redis for active session cookies.

- cache hit: call ERP endpoints directly
- cache miss/expired: execute full login flow then cache new cookies

Benefits:

- lower latency
- fewer captcha solves
- reduced upstream load

## Endpoint Groups

- `GET /` (health)
- `/attendance/*`
- `/timetable/*`
- `/circular/*`
- `/general/*`
- `/syllabus/*`

The exact sub-routes can evolve, but normalized response shape should stay consistent for agent consumers.

## Data and Package Dependencies

- `@alfred/db`: student identity and credential references
- `@alfred/redis`: session cookie cache
- `@alfred/utils`: secure credential decryption/encryption helpers
- upstream ERP: `https://qums.quantumuniversity.edu.in`

## Failure Modes and Mitigation

### Captcha OCR mismatch

- expected under real-world conditions
- retry with bounded attempts
- return explicit terminal failure when exhausted

### ERP markup/API drift

- parser assumptions can break
- isolate parser updates in this service only

### Session expiration

- treat cache as optimization, not source of truth
- fallback to login when cookies fail

## Failure Recovery Patterns

### Captcha Solve Fails After Retries

1. Log with context (student ID, attempt count).
2. Raise `CaptchaError` to caller.
3. Agent catches and retries chat with fallback response.
4. Operator investigates logs and OCR deps.

### ERP Endpoint Unreachable

1. Axios throws network error.
2. Adapter catches and returns `ServiceUnavailable` HTTP 503.
3. Agent catches and suggests retry.
4. Cache is not updated.

### Cookie Validation Failed

1. Cached cookies are stale/invalid.
2. ERP endpoint returns 401.
3. Adapter detects 401 and clears cache.
4. Next call triggers fresh login.

### Normalizer Crashes (Unexpected Response Shape)

1. Parser throws error.
2. Log raw response for analysis.
3. Return error to Agent.
4. Agent returns generic fallback message.
5. Operator updates normalizer for new shape.

## Debugging Tips

### Check Cache State

```bash
redis-cli GET erp:cookies:${studentId}
# Returns serialized cookies or nil if expired
```

### Test Login Directly

```bash
curl -X POST http://localhost:6868/login \
  -d '{"qid":"student123","password":"pass123"}'
```

### Inspect OCR Performance

```bash
# Enable Tesseract logging (set in config)
TESSERACT_DEBUG=1 pnpm --filter @alfred/erp-adapter dev
```

## Environment Variables

```env
PORT=6868
NODE_ENV=development

DATABASE_URL=<required>
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

ENCRYPTION_ALGORITHM=aes-256-cbc
ENCRYPTION_KEY=<64-char-hex-key>

TESSERACT_POOL_SIZE=4
MY_UUID=<optional>
```

## Runbook

### Start service

```bash
pnpm --filter @alfred/erp-adapter dev
```

### Health check

```bash
curl http://localhost:6868/
```

### If ERP calls are unstable

- verify Redis connectivity and cookie lifecycle
- verify OCR stack dependencies are installed
- inspect login token extraction assumptions
- inspect normalizer/parser changes for upstream drift

## Safe Extension Guidelines

- keep all ERP quirks isolated in adapter layer
- avoid exposing raw ERP payload complexity downstream
- maintain stable normalized contract for Agent tools
- include sufficient logging context for login and parse failures

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- Agent tool consumers: [../agent/README.md](../agent/README.md)
- API orchestration gateway: [../api/README.md](../api/README.md)
