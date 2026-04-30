import expressAsyncHandler from "express-async-handler";
import { prisma, redisClient } from "../config/db.config";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { AI_QUEUE } from "@alfred/queue";
import { count } from "console";

const getAllUserChats: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const chats = await prisma.chat.findMany({
      where: {
        studentId: req.user.id,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Chats retrieved successfully", chats));
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
    const { message, type } = req.body as {
      message: string;
      type: "chat" | "studychat";
    };

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
    } else {
      // Create new chat
      const newChat = await prisma.chat.create({
        data: {
          studentId: req.user.id,
        },
      });
      chatId = newChat.id;
    }

    const reqId = crypto.randomUUID();
    // let newMessage = "";
    AI_QUEUE.add("job", {
      message,
      chatId,
      userId: req.user.id,
      reqId,
      type,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    await new Promise((resolve, reject) => {
      redisClient.subscribe(reqId, (err) => {
        if (err) return reject(err);
      });

      const listener = (channel: string, message: string) => {
        if (channel !== reqId) return;

        try {
          const msg = JSON.parse(message);

          if (msg.type === "error") {
            redisClient.unsubscribe(reqId);
            redisClient.off("message", listener);
            return reject(
              new Error(msg.data.message || "Unknown error from worker"),
            );
          } else if (msg.type === "token") {
            res.write(msg.data);
          } else if (msg.type === "end") {
            redisClient.unsubscribe(reqId);
            redisClient.off("message", listener);
            return resolve(true);
          }
        } catch {
          console.error("Failed to parse message:", message);
          return;
        }
      };

      redisClient.on("message", listener);

      setTimeout(() => {
        redisClient.unsubscribe(reqId);
        redisClient.off("message", listener);
        reject(new Error("Timeout"));
      }, 30000);
    });

    res.end();
  },
);

export { getAllUserChats, getChatMessages, sendChatMessage };
