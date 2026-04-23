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

    const { chatId } = req.params;
    const { message } = req.body as { message: string };

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
    }

    const reqId = crypto.randomUUID();
console.log("here")
    let newMessage = "";
         AI_QUEUE.add("job", {
      message,
      chatId,
      userId: req.user.id,
      reqId,
    });

    await new Promise((resolve, reject) => {
      redisClient.subscribe(reqId, (err) => {
        if (err) return reject(err);
      });

      const listener = (channel: string, message: string) => {
        if (channel !== reqId) return;

        if (message === "END") {
          redisClient.unsubscribe(reqId);
          redisClient.off("message", listener);
          return resolve(true);
        }

        newMessage += message;
      };

      redisClient.on("message", listener);

      setTimeout(() => {
        redisClient.unsubscribe(reqId);
        redisClient.off("message", listener);
        reject(new Error("Timeout"));
      }, 30000);
    });



    res.status(200).json(
      new ApiResponse(200, "Message sent successfully", {
        chatId,
        reply: newMessage,
      }),
    );
  },
);

export { getAllUserChats, getChatMessages, sendChatMessage };
