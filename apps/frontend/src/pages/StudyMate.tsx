import { useEffect, useMemo, useState } from "react";
import ChatMain from "../components/chatMain";
import ChatSideBar from "../components/chatSideBar";
import type { ChatSummary } from "../components/chatSideBar";
import {
  createChat,
  fetchChatFiles,
  fetchChats,
  fetchMessages,
  sendChatMessage,
  uploadChatFile,
} from "./studyMate/chatApi";
import {
  formatChatTimestamp,
  formatMessageTimestamp,
} from "./studyMate/formatters";
import type { ChatFile, ChatThread } from "./studyMate/types";

const StudyMate = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadedChatIds, setLoadedChatIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loadedFileChatIds, setLoadedFileChatIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [filesByChatId, setFilesByChatId] = useState<
    Record<string, ChatFile[]>
  >({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedChatId, setSelectedChatId] = useState<string>("");

  const pickNewestChatId = (chatList: ChatThread[]) => {
    if (chatList.length === 0) {
      return "";
    }

    return chatList.reduce((latest, current) => {
      const latestTime = new Date(latest.updatedAt ?? 0).getTime();
      const currentTime = new Date(current.updatedAt ?? 0).getTime();
      return currentTime > latestTime ? current : latest;
    }).id;
  };

  const loadChats = async () => {
    setIsLoadingChats(true);
    setError(null);

    try {
      const chatList = await fetchChats();
      const nextThreads: ChatThread[] = chatList.map((chat) => ({
        id: chat.id,
        title: `Chat ${chat.id.slice(0, 8)}`,
        messages: [],
        updatedAt: chat.updatedAt || chat.createdAt,
      }));

      setThreads(nextThreads);
      setLoadedChatIds(new Set());
      if (nextThreads.length > 0) {
        setSelectedChatId(pickNewestChatId(nextThreads));
      }
    } catch {
      setError("Could not load chats.");
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    void loadChats();
  }, []);

  useEffect(() => {
    const selectedThread = threads.find(
      (thread) => thread.id === selectedChatId,
    );
    if (
      !selectedChatId ||
      selectedThread?.isDraft ||
      loadedChatIds.has(selectedChatId)
    ) {
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setError(null);

      try {
        const messages = await fetchMessages(selectedChatId);

        setThreads((current) =>
          current.map((thread) =>
            thread.id === selectedChatId
              ? {
                  ...thread,
                  messages: messages.map((message) => ({
                    id: message.id,
                    sender: message.sender,
                    content: message.content,
                    timestamp: formatMessageTimestamp(
                      message.updatedAt ?? message.createdAt,
                    ),
                  })),
                }
              : thread,
          ),
        );
        setLoadedChatIds((current) => {
          const next = new Set(current);
          next.add(selectedChatId);
          return next;
        });
      } catch {
        setError("Could not load messages.");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [selectedChatId, loadedChatIds, threads]);

  useEffect(() => {
    const selectedThread = threads.find(
      (thread) => thread.id === selectedChatId,
    );

    if (
      !selectedChatId ||
      selectedThread?.isDraft ||
      loadedFileChatIds.has(selectedChatId)
    ) {
      return;
    }

    const loadFiles = async () => {
      setIsLoadingFiles(true);
      setFileError(null);

      try {
        const files = await fetchChatFiles(selectedChatId);
        setFilesByChatId((current) => ({
          ...current,
          [selectedChatId]: files,
        }));
        setLoadedFileChatIds((current) => {
          const next = new Set(current);
          next.add(selectedChatId);
          return next;
        });
      } catch {
        setFileError("Could not load files.");
      } finally {
        setIsLoadingFiles(false);
      }
    };

    void loadFiles();
  }, [selectedChatId, loadedFileChatIds, threads]);

  const sidebarChats = useMemo<ChatSummary[]>(() => {
    return threads.map((thread) => {
      const lastMessage = thread.messages[thread.messages.length - 1];
      return {
        id: thread.id,
        title: thread.title,
        lastMessage:
          lastMessage?.content ?? (isLoadingChats ? "Loading..." : ""),
        updatedAt: thread.isDraft
          ? ""
          : (lastMessage?.timestamp ??
            formatChatTimestamp(thread.updatedAt ?? "")),
      };
    });
  }, [threads, isLoadingChats]);

  const activeThread = threads.find((thread) => thread.id === selectedChatId);
  const activeFiles = filesByChatId[selectedChatId] ?? [];

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const messageText = inputValue.trim();
    if (!messageText || isSending) return;

    if (!selectedChatId) {
      setError("Select a chat first.");
      return;
    }

    setInputValue("");
    setError(null);
    setIsSending(true);

    const nowIso = new Date().toISOString();
    const studentMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const selectedThread = threads.find(
      (thread) => thread.id === selectedChatId,
    );

    let currentChatId = selectedChatId;
    let wasDraft = false;

    try {
      if (selectedThread?.isDraft) {
        wasDraft = true;
        const newChat = await createChat();
        currentChatId = newChat.id;

        setThreads((current) =>
          current.map((thread) =>
            thread.id === selectedChatId
              ? {
                  ...thread,
                  id: newChat.id,
                  title: `Chat ${newChat.id.slice(0, 8)}`,
                  updatedAt: newChat.updatedAt ?? newChat.createdAt,
                  isDraft: false,
                }
              : thread,
          ),
        );
        setLoadedChatIds((current) => {
          const next = new Set(current);
          next.delete(selectedChatId);
          next.add(newChat.id);
          return next;
        });
        setLoadedFileChatIds((current) => {
          const next = new Set(current);
          next.delete(selectedChatId);
          next.add(newChat.id);
          return next;
        });
        setFilesByChatId((current) => {
          const { [selectedChatId]: _removed, ...rest } = current;
          return { ...rest, [newChat.id]: [] };
        });
        setSelectedChatId(newChat.id);
      }

      setThreads((current) =>
        current.map((thread) =>
          thread.id === currentChatId
            ? {
                ...thread,
                updatedAt: nowIso,
                messages: [
                  ...thread.messages,
                  {
                    id: studentMessageId,
                    sender: "STUDENT",
                    content: messageText,
                    timestamp: formatMessageTimestamp(nowIso),
                  },
                  {
                    id: assistantMessageId,
                    sender: "AGENT",
                    content: "",
                    timestamp: formatMessageTimestamp(nowIso),
                    isStreaming: true,
                  },
                ],
              }
            : thread,
        ),
      );

      const stream = await sendChatMessage(currentChatId, messageText);

      const reader = stream.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let streamedContent = "";
      let pending = "";
      let lastFlush = Date.now();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const raw = line.replace(/^data:\s*/, "").trim();

          if (raw === "[DONE]") {
            flush();
            finalize();
            return;
          }

          try {
            const parsed = JSON.parse(raw);
            if (parsed.token) {
              pending += parsed.token;
            }
          } catch {}
        }

        if (Date.now() - lastFlush > 50) {
          flush();
        }
      }

      flush();
      finalize();

      function flush() {
        if (!pending) return;

        streamedContent += pending;
        pending = "";
        lastFlush = Date.now();

        setThreads((current) =>
          current.map((thread) =>
            thread.id === currentChatId
              ? {
                  ...thread,
                  messages: thread.messages.map((message) =>
                    message.id === assistantMessageId
                      ? { ...message, content: streamedContent }
                      : message,
                  ),
                }
              : thread,
          ),
        );
      }

      function finalize() {
        setThreads((current) =>
          current.map((thread) =>
            thread.id === currentChatId
              ? {
                  ...thread,
                  messages: thread.messages.map((message) =>
                    message.id === assistantMessageId
                      ? { ...message, isStreaming: false }
                      : message,
                  ),
                }
              : thread,
          ),
        );
      }

      if (wasDraft) {
        setLoadedChatIds((current) => {
          const next = new Set(current);
          next.add(currentChatId);
          return next;
        });
      }
    } catch {
      setError("Message failed to send.");
    } finally {
      setIsSending(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedChatId) {
      setFileError("Select a chat first.");
      return;
    }

    if (!selectedFile) {
      setFileError("Choose a PDF to upload.");
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFileError("Only PDF files are supported.");
      return;
    }

    setFileError(null);
    setIsUploadingFile(true);

    let currentChatId = selectedChatId;
    const uploadStartedAt = new Date().toISOString();

    try {
      const selectedThread = threads.find(
        (thread) => thread.id === selectedChatId,
      );

      if (selectedThread?.isDraft) {
        const newChat = await createChat();
        currentChatId = newChat.id;

        setThreads((current) =>
          current.map((thread) =>
            thread.id === selectedChatId
              ? {
                  ...thread,
                  id: newChat.id,
                  title: `Chat ${newChat.id.slice(0, 8)}`,
                  updatedAt: newChat.updatedAt ?? newChat.createdAt,
                  isDraft: false,
                }
              : thread,
          ),
        );
        setLoadedChatIds((current) => {
          const next = new Set(current);
          next.delete(selectedChatId);
          next.add(newChat.id);
          return next;
        });
        setLoadedFileChatIds((current) => {
          const next = new Set(current);
          next.delete(selectedChatId);
          next.add(newChat.id);
          return next;
        });
        setFilesByChatId((current) => {
          const { [selectedChatId]: _removed, ...rest } = current;
          return { ...rest, [newChat.id]: [] };
        });
        setSelectedChatId(newChat.id);
      }

      await uploadChatFile(currentChatId, selectedFile);
      await pollForProcessedFiles(currentChatId, uploadStartedAt);
      setSelectedFile(null);
    } catch {
      setFileError("Upload failed.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const pollForProcessedFiles = async (
    chatId: string,
    uploadedAfter: string,
  ) => {
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const files = await fetchChatFiles(chatId);
      setFilesByChatId((current) => ({
        ...current,
        [chatId]: files,
      }));
      setLoadedFileChatIds((current) => {
        const next = new Set(current);
        next.add(chatId);
        return next;
      });

      const uploadedAfterTime = Date.parse(uploadedAfter);
      const processed = files.some((file) => {
        const createdTime = Date.parse(file.createdAt);
        return createdTime >= uploadedAfterTime && file.status === "PROCESSED";
      });

      if (processed) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-50 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid h-[calc(100vh-6rem)] w-full max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
        <ChatSideBar
          chats={sidebarChats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onNewChat={() => {
            const newId = `draft-${crypto.randomUUID()}`;
            const newThread: ChatThread = {
              id: newId,
              title: "New chat",
              messages: [],
              isDraft: true,
            };
            setThreads((current) => [newThread, ...current]);
            setSelectedChatId(newId);
            setLoadedChatIds((current) => {
              const next = new Set(current);
              next.delete(newId);
              return next;
            });
          }}
        />

        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatMain
              activeThread={
                isLoadingMessages && activeThread
                  ? { ...activeThread, messages: [] }
                  : activeThread
              }
              inputValue={inputValue}
              isSending={isSending}
              onChange={setInputValue}
              onSubmit={sendMessage}
            />
          </div>
          <section className="shrink-0 h-44 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Files
                </h2>
                <p className="text-xs text-slate-500">
                  PDFs uploaded to this study chat.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] ?? null)
                    }
                    disabled={isUploadingFile}
                  />
                  {selectedFile ? "Change PDF" : "Choose PDF"}
                </label>
                <button
                  type="button"
                  onClick={uploadFile}
                  disabled={isUploadingFile || !selectedFile}
                  className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isUploadingFile ? "Uploading" : "Upload"}
                </button>
              </div>
            </div>
            {selectedFile ? (
              <p className="mt-2 text-xs text-slate-600">
                Selected: {selectedFile.name}
              </p>
            ) : null}
            {fileError ? (
              <p className="mt-2 text-xs text-red-600">{fileError}</p>
            ) : null}
            <div className="mt-3">
              {isLoadingFiles ? (
                <p className="text-xs text-slate-500">Loading files...</p>
              ) : activeFiles.length ? (
                <div className="max-h-24 space-y-2 overflow-y-auto pr-1">
                  {activeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {file.fileName.split("/").pop()}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                        {file.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No files yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default StudyMate;
