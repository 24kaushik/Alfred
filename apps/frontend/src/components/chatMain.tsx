import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { ChatThread } from "../pages/erp-chat/types";

type ChatMainProps = {
  activeThread?: ChatThread;
  inputValue: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const ChatMain = ({
  activeThread,
  inputValue,
  isSending,
  onChange,
  onSubmit,
}: ChatMainProps) => {
  const markdownComponents = useMemo<Components>(
    () => ({
      p: ({ children, ...props }) => (
        <p className="mb-2 last:mb-0" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }) => (
        <ul
          className="mb-2 list-inside list-disc space-y-1 last:mb-0"
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          className="mb-2 list-inside list-decimal space-y-1 last:mb-0"
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => <li {...props}>{children}</li>,
      code: ({ className, children, ...props }) => (
        <code
          className={`rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs ${
            className || ""
          }`}
          {...props}
        >
          {children}
        </code>
      ),
      pre: ({ children, ...props }) => (
        <pre
          className="mb-2 overflow-x-auto rounded bg-slate-200 p-2 last:mb-0"
          {...props}
        >
          {children}
        </pre>
      ),
      strong: ({ children, ...props }) => (
        <strong className="font-semibold" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          {children}
        </em>
      ),
      h1: ({ children, ...props }) => (
        <h1 className="mb-2 text-base font-bold last:mb-0" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 className="mb-2 text-sm font-bold last:mb-0" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="mb-2 text-sm font-semibold last:mb-0" {...props}>
          {children}
        </h3>
      ),
      table: ({ children, ...props }) => (
        <div className="mb-2 overflow-x-auto rounded border border-slate-300 last:mb-0">
          <table className="w-full border-collapse" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="bg-slate-200" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
      tr: ({ children, ...props }) => (
        <tr className="border-b border-slate-300" {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }) => (
        <th
          className="border border-slate-300 px-3 py-2 text-left font-semibold"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td className="border border-slate-300 px-3 py-2" {...props}>
          {children}
        </td>
      ),
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="mb-2 border-l-4 border-slate-300 bg-slate-100 px-3 py-2 italic last:mb-0"
          {...props}
        >
          {children}
        </blockquote>
      ),
    }),
    [],
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.id, activeThread?.messages.length]);

  return (
    <section className="flex min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
          {activeThread?.title ?? "Select a chat"}
        </h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Ask Alfred about ERP, attendance, circulars, and exams.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
        {activeThread?.messages.length ? (
          activeThread.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "STUDENT" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                  message.sender === "STUDENT"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {message.sender === "AGENT" ? (
                  message.isStreaming ? (
                    <pre className="whitespace-pre-wrap font-sans">
                      {message.content + "▍"}
                    </pre>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <p
                  className={`mt-2 text-[10px] ${
                    message.sender === "STUDENT"
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Start a new conversation by selecting a chat or creating one.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="border-t border-slate-200 px-4 py-3 sm:px-6"
        onSubmit={onSubmit}
      >
        <div className="flex items-end gap-2 sm:gap-3">
          <textarea
            className="min-h-12 max-h-40 flex-1 resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(event) => onChange(event.target.value)}
            disabled={isSending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
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
  );
};

export type { ChatThread };
export default ChatMain;
