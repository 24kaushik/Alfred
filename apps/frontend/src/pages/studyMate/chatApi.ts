import type { ApiResponse, ChatDto, ChatFile, MessageDto } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:6969";
const CHAT_BASE_URL = `${API_BASE_URL}/api/v1/chat/studychats`;
const CREATE_CHAT_URL = `${API_BASE_URL}/api/v1/chat/studychat`;
const MESSAGE_BASE_URL = `${API_BASE_URL}/api/v1/chat`;

const fetchChats = async () => {
  const response = await fetch(CHAT_BASE_URL, {
    method: "GET",
    headers: {
      "Content-Type": "text/plain",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch chats");
  }

  const payload = (await response.json()) as ApiResponse<ChatDto[]>;
  return payload.data ?? [];
};

const fetchMessages = async (chatId: string) => {
  const response = await fetch(`${MESSAGE_BASE_URL}/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/plain",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch messages");
  }

  const payload = (await response.json()) as ApiResponse<MessageDto[]>;
  return payload.data ?? [];
};

const fetchChatFiles = async (chatId: string) => {
  const response = await fetch(`${MESSAGE_BASE_URL}/files/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "text/plain",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch files");
  }

  const payload = (await response.json()) as ApiResponse<ChatFile[]>;
  return payload.data ?? [];
};

const createChat = async () => {
  const response = await fetch(CREATE_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to create study chat");
  }

  const payload = (await response.json()) as ApiResponse<ChatDto>;
  if (!payload.data) {
    throw new Error("Invalid study chat response");
  }

  return payload.data;
};

const sendChatMessage = async (chatId: string, message: string) => {
  const response = await fetch(`${MESSAGE_BASE_URL}/${chatId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ message, type: "studychat" }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to send message");
  }

  return response.body;
};

const uploadChatFile = async (chatId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${MESSAGE_BASE_URL}/upload/${chatId}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Unable to upload file");
  }

  return response.json();
};

export {
  createChat,
  fetchChats,
  fetchChatFiles,
  fetchMessages,
  sendChatMessage,
  uploadChatFile,
};
