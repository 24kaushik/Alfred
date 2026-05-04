type ChatMessage = {
  id: string;
  sender: "STUDENT" | "AGENT";
  content: string;
  timestamp: string;
};

type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt?: string;
  isDraft?: boolean;
};

type ChatDto = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type MessageDto = {
  id: string;
  chatId: string;
  sender: "STUDENT" | "AGENT";
  content: string;
  createdAt: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  status: number;
  message: string;
  data?: T;
};

export type { ApiResponse, ChatDto, ChatMessage, ChatThread, MessageDto };
