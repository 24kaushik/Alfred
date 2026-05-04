import { useEffect, useRef } from "react";
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
                <p>{message.content}</p>
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
