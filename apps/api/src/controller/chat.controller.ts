import expressAsyncHandler from "express-async-handler";
import { prisma, redisClient } from "../config/db.config";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { addToProcessQueue, AI_QUEUE, PROCESS_QUEUE } from "@alfred/queue";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const getAllUserChats: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const chats = await prisma.chat.findMany({
      where: {
        studentId: req.user.id,
        type: "CHAT",
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Chats retrieved successfully", chats));
  },
);

const getAllStudyChats: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const chats = await prisma.chat.findMany({
      where: {
        studentId: req.user.id,
        type: "STUDYCHAT",
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Study chats retrieved successfully", chats));
  },
);

const getChatMessages: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const { chatId } = req.params as { chatId: string };

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        studentId: req.user.id,
      },
    });

    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: chat.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Messages retrieved successfully", messages));
  },
);

const sendChatMessage: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Unauthorized");
    }

    let { chatId } = req.params;
    const { message, type } = req.body as { message: string; type: string };

    let chatType: "CHAT" | "STUDYCHAT" =
      type === "studychat" ? "STUDYCHAT" : "CHAT";

    if (chatId && typeof chatId === "string") {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          studentId: req.user.id,
        },
      });

      if (!chat) {
        throw new ApiError(404, "Chat not found");
      }

      chatType = chat.type;
    }

    const reqId = crypto.randomUUID();

    const typeStr = chatType === "STUDYCHAT" ? "studychat" : "chat";

    AI_QUEUE.add("job", {
      message,
      chatId,
      userId: req.user.id,
      reqId,
      type: typeStr,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    const keepAlive = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15000);

    await new Promise((resolve, reject) => {
      redisClient.subscribe(reqId, (err) => {
        if (err) return reject(err);
      });

      const listener = (channel: string, message: string) => {
        if (channel !== reqId) return;

        try {
          const msg = JSON.parse(message);

          if (msg.type === "error") {
            res.write(
              `data: ${JSON.stringify({ error: msg.data.message })}\n\n`,
            );
            cleanup();
            return reject(new Error(msg.data.message));
          }

          if (msg.type === "token") {
            res.write(`data: ${JSON.stringify({ token: msg.data })}\n\n`);
          }

          if (msg.type === "end") {
            res.write(`data: [DONE]\n\n`);
            cleanup();
            return resolve(true);
          }
        } catch (e) {
          console.error("Parse error:", message);
        }
      };

      const cleanup = () => {
        clearInterval(keepAlive);
        redisClient.unsubscribe(reqId);
        redisClient.off("message", listener);
      };

      redisClient.on("message", listener);

      setTimeout(() => {
        cleanup();
        reject(new Error("Timeout"));
      }, 60000);
    });

    res.end();
  },
);

const uploadFileToChat: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { chatId } = req.params as { chatId: string };

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, studentId: req.user?.id },
    });
    if (!chat) throw new ApiError(404, "Chat not found");
    if (chat.type !== "STUDYCHAT") {
      throw new ApiError(400, "File upload not allowed in this chat");
    }

    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    if (req.file.mimetype !== "application/pdf") {
      throw new ApiError(400, "Only PDF files are allowed");
    }

    const formdata = new FormData();
    formdata.append("file", fs.createReadStream(req.file.path));
    formdata.append("chatId", chatId);
    const request = await axios.post(
      `${process.env.AGENT_URL}/file/upload/${chatId}`,
      formdata,
      {
        headers: {
          ...formdata.getHeaders(),
        },
      },
    );

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    if (
      request.status !== 200 ||
      !request.data ||
      request.data.data?.filePath === undefined
    ) {
      throw new ApiError(
        request.status,
        request.statusText || "File upload failed",
        request.data,
      );
    }

    await addToProcessQueue({
      filePath: request.data.data.filePath,
      chatId,
    });

    res
      .status(request.status)
      .json(new ApiResponse(request.status, request.statusText, request.data));
  },
);

const getFilesInChat: RequestHandler = expressAsyncHandler(async (req, res) => {
  const { chatId } = req.params as { chatId: string };
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      studentId: req.user?.id,
    },
  });

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  const files = await prisma.file.findMany({
    where: {
      chatId,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Files retrieved successfully", files));
});

const createNewChat: RequestHandler = expressAsyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const newChat = await prisma.chat.create({
    data: {
      studentId: req.user.id,
    },
  });

  if (!newChat) {
    throw new ApiError(500, "Failed to create chat");
  }

  res
    .status(201)
    .json(new ApiResponse(201, "Chat created successfully", newChat));
});

const createNewStudyChat: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const newChat = await prisma.chat.create({
      data: {
        studentId: req.user.id,
        type: "STUDYCHAT",
      },
    });

    if (!newChat) {
      throw new ApiError(500, "Failed to create study chat");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Study chat created successfully", newChat));
  },
);

export {
  getAllUserChats,
  getChatMessages,
  sendChatMessage,
  createNewChat,
  getFilesInChat,
  uploadFileToChat,
  getAllStudyChats,
  createNewStudyChat,
};
