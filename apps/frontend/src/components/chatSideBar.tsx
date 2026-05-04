type ChatSummary = {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
};

type ChatSideBarProps = {
  chats: ChatSummary[];
  selectedChatId: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
};

const ChatSideBar = ({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
}: ChatSideBarProps) => {
  return (
    <aside className="flex w-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Chats</h2>
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          onClick={onNewChat}
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {chats.map((chat) => {
          const isActive = chat.id === selectedChatId;
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => onSelectChat(chat.id)}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold">{chat.title}</p>
                <span
                  className={`text-[10px] ${
                    isActive ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {chat.updatedAt}
                </span>
              </div>
              <p
                className={`mt-1 line-clamp-2 text-xs ${
                  isActive ? "text-slate-200" : "text-slate-500"
                }`}
              >
                {chat.lastMessage}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export type { ChatSummary };
export default ChatSideBar;
