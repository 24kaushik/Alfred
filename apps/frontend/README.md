# Frontend (`@alfred/frontend`)

The frontend is Alfred's user-facing application built with React and Vite. It delivers authentication UX, chat interfaces, study workflows, and real-time rendering of streamed assistant output.

This app is where system capabilities become student experience.

## Source Code Structure

```text
src/
├─ main.tsx                # React entry point
├─ App.tsx                 # Router setup
├─ App.css                 # Global styles
├─ assets/                 # Images, icons
├─ components/             # Reusable UI components
│  ├─ ChatMain.tsx        # Chat message pane (shared by ERP + Study)
│  ├─ ChatSidebar.tsx     # Thread list sidebar
│  └─ (...other components)
├─ pages/
│  ├─ LoginPage.tsx       # Google OAuth flow
│  ├─ ErpChat.tsx         # ERP chat experience
│  └─ StudyMate.tsx       # Study chat + file upload experience
└─ (api client hooks, types, etc.)
```

## App Boot and Routing

1. `main.tsx` mounts React to DOM.
2. `App.tsx` sets up BrowserRouter.
3. Routes:
   - `/login` → LoginPage (redirected here if no auth cookie)
   - `/erp-chat` → ErpChat page
   - `/studymate` → StudyMate page
4. On page load, each page fetches current user + initial thread list.

## Authentication Flow: First Visit

1. User lands on app → no `authToken` cookie.
2. Router redirects to `/login`.
3. LoginPage renders Google Sign-In button.
4. User clicks → Google popup.
5. User completes OAuth → Google redirects with auth code.
6. LoginPage extracts code and calls API `POST /api/v1/auth/google`.
7. API responds with `authToken` cookie + student profile.
8. Cookie is automatically stored by browser.
9. LoginPage redirects to `/erp-chat`.
10. Subsequent requests include `authToken` automatically.

## ERP Chat Page: State and Lifecycle

### Local State

```typescript
const [threads, setThreads] = useState<ChatThread[]>([]);
const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [newMessage, setNewMessage] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [loadedChatIds, setLoadedChatIds] = useState(new Set<string>());
```

### Initial Load Effect

```typescript
useEffect(() => {
  // 1. Fetch all chats from API
  const chats = await fetchChats();
  setThreads(chats);

  // 2. Select newest chat
  const selected = chats[0]?.id;
  setSelectedChatId(selected);

  // 3. Trigger message load for selected chat
}, []);
```

### Message Loading (Lazy)

```typescript
useEffect(() => {
  if (!selectedChatId || loadedChatIds.has(selectedChatId)) return;

  // 1. Fetch messages for selected chat
  const msgs = await fetchMessages(selectedChatId);
  setMessages(msgs);

  // 2. Mark as loaded to avoid refetch
  setLoadedChatIds((prev) => new Set([...prev, selectedChatId]));
}, [selectedChatId, loadedChatIds]);
```

### Send Message Flow

```typescript
async function sendMessage() {
  // 1. Optimistic UI: append user message
  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      content: newMessage,
      id: uuid(),
    },
  ]);

  // 2. Create assistant placeholder
  const assistantId = uuid();
  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: "",
      id: assistantId,
    },
  ]);

  // 3. Open SSE stream to API
  const eventSource = new EventSource(
    `/api/v1/chat/${selectedChatId}?message=${encodeURIComponent(newMessage)}`,
  );

  // 4. Consume token events
  let assistantContent = "";
  eventSource.addEventListener("message", (event) => {
    const parsed = JSON.parse(event.data);
    if (parsed.type === "token") {
      assistantContent += parsed.content;
      // Update assistant message in-place
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === assistantId);
        prev[idx].content = assistantContent;
        return [...prev];
      });
    }
  });

  // 5. Handle stream end
  eventSource.addEventListener("end", () => {
    eventSource.close();
  });

  // 6. Clear input
  setNewMessage("");
}
```

## StudyMate Page: File Upload and Polling

### File Upload State

```typescript
const [filesByChatId, setFilesByChatId] = useState<Map<string, File[]>>(
  new Map(),
);
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [isUploadingFile, setIsUploadingFile] = useState(false);
const [loadedFileChatIds, setLoadedFileChatIds] = useState(new Set<string>());
```

### File List Fetch (Lazy)

```typescript
useEffect(() => {
  if (!selectedChatId || loadedFileChatIds.has(selectedChatId)) return;

  // Fetch files for this chat
  const files = await fetchChatFiles(selectedChatId);
  setFilesByChatId((prev) => new Map([...prev, [selectedChatId, files]]));
  setLoadedFileChatIds((prev) => new Set([...prev, selectedChatId]));
}, [selectedChatId, loadedFileChatIds]);
```

### File Upload and Post-Upload Polling

```typescript
async function uploadFile(file: File) {
  setIsUploadingFile(true);

  // 1. Create FormData
  const formData = new FormData();
  formData.append("file", file);

  // 2. Upload
  try {
    await uploadChatFile(selectedChatId, formData);
  } catch (error) {
    console.error("Upload failed", error);
    setIsUploadingFile(false);
    return;
  }

  // 3. Poll for file status (only after upload, not continuous)
  const maxAttempts = 60; // 1 minute with 1s interval
  for (let i = 0; i < maxAttempts; i++) {
    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch file list
    const files = await fetchChatFiles(selectedChatId);

    // Check if any file reached PROCESSED
    const processed = files.some((f) => f.status === "PROCESSED");
    if (processed) {
      // Update local state
      setFilesByChatId((prev) => new Map([...prev, [selectedChatId, files]]));
      setIsUploadingFile(false);
      return;
    }
  }

  // Timeout reached
  console.warn("File processing timeout");
  setIsUploadingFile(false);
}
```

## Draft Chat to Persisted Chat Transition

Some flows start with draft chats:

```typescript
function createDraftChat() {
  const draftId = `draft-${uuid()}`;
  const draftChat = {
    id: draftId,
    isDraft: true,
    title: "New Chat",
    type: "STUDYCHAT",
    messages: [],
  };
  setThreads((prev) => [draftChat, ...prev]);
  setSelectedChatId(draftId);
}

async function sendMessageFromDraft() {
  // If selected chat is draft, create real chat first
  if (selectedChatId.startsWith("draft-")) {
    const realChat = await createChat({
      title: "New Study Chat",
      type: "STUDYCHAT",
    });

    // 1. Remap draft ID to real ID
    setSelectedChatId(realChat.id);

    // 2. Update threads list
    setThreads((prev) =>
      prev.map((t) => (t.id === selectedChatId ? realChat : t)),
    );

    // 3. Clear draft from message/file caches
    setMessages([]);
    setLoadedChatIds((prev) => {
      const next = new Set(prev);
      next.delete(selectedChatId);
      next.add(realChat.id);
      return next;
    });
  }

  // Now send message normally
  await sendMessage();
}
```

## Why This App Exists

A strong backend is useless if interaction quality is poor. The frontend is designed to make complex backend orchestration feel simple and responsive.

Primary goals:

- fast, clear authentication flow
- smooth chat interactions with long conversation support
- progressive response rendering for lower perceived latency
- practical study upload UX with visible file state

## Core Features

### Authentication UX

- Google sign-in entry flow
- cookie-backed session behavior through API
- route-level access control behavior in client routing layer

### ERP Chat UX

- thread list in sidebar
- lazy message loading on thread selection
- optimistic message append for user messages
- streamed assistant token rendering in-place

### StudyMate UX

- dedicated study chat mode
- file upload per selected study chat
- per-chat file listing and status visualization
- retrieval-grounded conversation support

## Route Surface

- `/login`
- `/erp-chat`
- `/studymate`

Each route uses shared chat UI primitives while preserving mode-specific behavior.

## Chat Interaction Model

### Draft chat to persisted chat transition

Frontend supports draft chat records for fast UX. On first send/upload:

1. create chat on backend
2. remap local draft ID to persisted chat ID
3. migrate local caches keyed by chat ID
4. continue operation without disrupting user flow

This avoids forcing users through a separate "create chat" step before sending.

### Streaming response model

1. append optimistic user message
2. append assistant placeholder bubble
3. consume SSE token chunks
4. incrementally update assistant bubble
5. finalize on `end` or gracefully close on `error`

## Study File Interaction Model

### Upload constraints

- PDF-only uploads supported
- client-side validation before network call

### File visibility

- file list is chat-scoped
- status indicates whether file is ingestion-ready for retrieval
- UI layout remains compact even with many files

### Post-upload polling strategy

Polling should be event-driven after upload attempts rather than always-on background polling, keeping network cost practical.

## State and Data Handling

Frontend keeps explicit local states for:

- thread lists
- selected chat IDs
- message lists per chat
- loading and error states
- file lists and upload flags for study mode

The model prefers explicitness and predictability over hidden global complexity.

## Network Contract Expectations

Frontend assumes:

- cookie-based auth (`credentials: include`)
- SSE stream for incremental chat output
- stable chat/file API signatures under `/api/v1`
- deterministic file status transitions for study uploads

## Network Requests: Axios Patterns

### Custom Axios Instance

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // auto-include cookies
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Chat Message Send (SSE)

```typescript
// Special: uses EventSource for streaming
const eventSource = new EventSource(
  `${API_URL}/api/v1/chat/${chatId}?message=${msg}`,
);
```

### File Upload (Multipart)

```typescript
const formData = new FormData();
formData.append("file", file);

await apiClient.post(`/api/v1/chat/upload/${chatId}`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

## UI Component Hierarchy

```
App (router setup)
  ├─ LoginPage
  │  └─ Google Sign-In button
  ├─ ErpChat
  │  ├─ ChatSidebar
  │  │  └─ thread list
  │  └─ ChatMain
  │     ├─ message pane
  │     └─ message input
  └─ StudyMate
     ├─ ChatSidebar (shared)
     ├─ ChatMain (shared)
     └─ FileUploadPanel
        ├─ file input
        └─ file list
```

## Error Handling and User Feedback

### Chat Errors

- SSE `error` event → display error banner
- Network timeout → "Connection lost" message
- Invalid chat ID → redirect to chat list

### File Upload Errors

- File too large → validation before upload
- Wrong file type → reject non-PDF
- Upload failure → show error, allow retry
- Processing stuck → after timeout, show "Processing taking longer than expected"

### Auth Errors

- Expired token → redirect to login
- CORS failure → check API CORS config
- OAuth failure → display error from Google

## Environment Variables

```env
VITE_API_URL=http://localhost:6969
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

## Runbook

### Start dev server

```bash
pnpm --filter @alfred/frontend dev
```

### Build production bundle

```bash
pnpm --filter @alfred/frontend build
```

### Preview production bundle

```bash
pnpm --filter @alfred/frontend preview
```

## Debugging Checklist

- auth failing: verify cookie/CORS and API URL
- stream stuck: verify SSE payloads and worker pipeline
- file status stuck: verify upload route and processing queue path
- thread selection bugs: inspect draft-to-real ID remap handling

## UX Reliability Guidelines

- preserve full-height chat usability for long threads
- avoid layout jumps while stream tokens append
- keep file panel constrained and scannable
- always surface terminal states (success/error) for user actions

## Related Documentation

- Root overview: [../../README.md](../../README.md)
- API contract: [../api/README.md](../api/README.md)
- Worker stream relay: [../worker/README.md](../worker/README.md)
- Agent retrieval/runtime behavior: [../agent/README.md](../agent/README.md)
