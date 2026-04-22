import expressAsyncHandler from "express-async-handler";
import { prisma } from "../config/db.config";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { validationResult } from "express-validator";

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

export { getAllUserChats, getChatMessages };
