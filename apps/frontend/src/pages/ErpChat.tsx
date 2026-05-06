import { useEffect, useMemo, useState } from "react";
import ChatMain from "../components/chatMain";
import ChatSideBar from "../components/chatSideBar";
import type { ChatSummary } from "../components/chatSideBar";
import {
  createChat,
  fetchChats,
  fetchMessages,
  sendChatMessage,
} from "./erp-chat/chatApi";
import {
  formatChatTimestamp,
  formatMessageTimestamp,
} from "./erp-chat/formatters";
import type { ChatThread } from "./erp-chat/types";

const ErpChat = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadedChatIds, setLoadedChatIds] = useState<Set<string>>(
    () => new Set(),
  );

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
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default ErpChat;
