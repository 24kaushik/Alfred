// TODO FIX THE RENDERING OF STREAM IN MD

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Sender = "STUDENT" | "AGENT";

type Chat = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  chatId: string;
  sender: Sender;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data?: T;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:6969";
const CHAT_BASE_URL = `${API_BASE_URL}/api/v1/chat`;

const formatChatLabel = (chat: Chat) => {
  const date = new Date(chat.updatedAt || chat.createdAt);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ErpChat = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileChats, setShowMobileChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const token = localStorage.getItem("authToken");
    return token
      ? { Authorization: `Bearer ${token}` }
      : ({} as Record<string, string>);
  }, []);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [chats]);

  const fetchChats = async () => {
    setIsLoadingChats(true);
    setError(null);

    try {
      const response = await fetch(CHAT_BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to fetch chats");
      }

      const payload = (await response.json()) as ApiResponse<Chat[]>;
      const incomingChats = payload.data ?? [];
      setChats(incomingChats);

      if (incomingChats.length > 0 && !selectedChatId) {
        const newest = [...incomingChats].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0];
        setSelectedChatId(newest.id);
      }

      return incomingChats;
    } catch {
      setError("Could not load chats. Please login again.");
      return [] as Chat[];
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    setError(null);

    try {
      const response = await fetch(`${CHAT_BASE_URL}/${chatId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to fetch messages");
      }

      const payload = (await response.json()) as ApiResponse<Message[]>;
      setMessages(payload.data ?? []);
    } catch {
      setError("Could not load messages for this chat.");
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    void fetchChats();
  }, []);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    void fetchMessages(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const messageText = inputValue.trim();
    if (!messageText || isSending) {
      return;
    }

    setInputValue("");
    setError(null);
    setIsSending(true);

    const now = new Date().toISOString();
    const studentMessage: Message = {
      id: crypto.randomUUID(),
      chatId: selectedChatId ?? "pending",
      sender: "STUDENT",
      content: messageText,
      createdAt: now,
    };

    const assistantTempId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantTempId,
      chatId: selectedChatId ?? "pending",
      sender: "AGENT",
      content: "",
      createdAt: now,
    };

    setMessages((current) => [...current, studentMessage, assistantMessage]);

    try {
      const targetUrl = selectedChatId
        ? `${CHAT_BASE_URL}/${selectedChatId}`
        : CHAT_BASE_URL;

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({
          message: messageText,
          type: "chat",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to send message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let streamedContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) {
            continue;
          }

          const rawData = line.slice(5);
          const token = (
            rawData.startsWith(" ") ? rawData.slice(1) : rawData
          ).replace(/\r$/, "");
          streamedContent += token;

          setMessages((current) =>
            current.map((item) =>
              item.id === assistantTempId
                ? { ...item, content: streamedContent }
                : item,
            ),
          );
        }
      }

      const refreshedChats = await fetchChats();
      if (!selectedChatId && refreshedChats.length > 0) {
        const latest = [...refreshedChats].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0];
        setSelectedChatId(latest.id);
      }
    } catch {
      setError("Message failed to send. Please try again.");
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantTempId
            ? {
                ...item,
                content: "I could not generate a reply. Please retry.",
              }
            : item,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid h-[calc(100vh-6rem)] w-full max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
        <aside
          className={`${showMobileChats ? "flex" : "hidden"} lg:flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-900">ERP Chat</h1>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              onClick={() => {
                setSelectedChatId(null);
                setMessages([]);
                setShowMobileChats(false);
              }}
            >
              New Chat
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {isLoadingChats ? (
              <p className="text-sm text-slate-500">Loading chats...</p>
            ) : sortedChats.length === 0 ? (
              <p className="text-sm text-slate-500">
                No previous chats yet. Start a new conversation.
              </p>
            ) : (
              sortedChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selectedChatId === chat.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setShowMobileChats(false);
                  }}
                >
                  <p className="truncate text-sm font-medium">
                    Chat {chat.id.slice(0, 8)}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      selectedChatId === chat.id
                        ? "text-slate-200"
                        : "text-slate-500"
                    }`}
                  >
                    {formatChatLabel(chat)}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                Ask Alfred anything about ERP and QUMS
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Streaming replies are powered by /api/v1/chat
              </p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 lg:hidden"
              onClick={() => setShowMobileChats((current) => !current)}
            >
              Chats
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
            {isLoadingMessages ? (
              <p className="text-sm text-slate-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Start your ERP chat by typing a question below.
              </div>
            ) : (
              messages.map((message) => {
                const isStudent = message.sender === "STUDENT";
                return (
                  <div
                    key={message.id}
                    className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                        isStudent
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {isStudent ? (
                        message.content || "..."
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-2 list-inside list-disc space-y-1 last:mb-0">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-2 list-inside list-decimal space-y-1 last:mb-0">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            code: ({ children }) => (
                              <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="mb-2 overflow-x-auto rounded bg-slate-200 p-2 last:mb-0">
                                {children}
                              </pre>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                            h1: ({ children }) => (
                              <h1 className="mb-2 text-base font-bold last:mb-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="mb-2 text-sm font-bold last:mb-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="mb-2 text-sm font-semibold last:mb-0">
                                {children}
                              </h3>
                            ),
                            table: ({ children }) => (
                              <div className="mb-2 overflow-x-auto rounded border border-slate-300 last:mb-0">
                                <table className="w-full border-collapse">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-slate-200">{children}</thead>
                            ),
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => (
                              <tr className="border-b border-slate-300">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-slate-300 px-3 py-2">
                                {children}
                              </td>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="mb-2 border-l-4 border-slate-300 bg-slate-100 px-3 py-2 italic last:mb-0">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content || "..."}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-200 px-4 py-3 sm:px-6"
          >
            {error ? (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                className="min-h-12 max-h-40 flex-1 resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    const form = event.currentTarget.closest(
                      "form",
                    ) as HTMLFormElement;
                    form?.dispatchEvent(new Event("submit", { bubbles: true }));
                  }
                }}
                placeholder="Ask about attendance, syllabus, circulars, exams..."
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || inputValue.trim().length === 0}
                className="h-12 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:px-5"
              >
                {isSending ? "Sending" : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ErpChat;
