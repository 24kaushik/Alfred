import { Request, RequestHandler, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import fs from "fs/promises";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { validationResult } from "express-validator";
import { loadFileFromTmp } from "../utils/pdfLoader";
import { addChatDocuments } from "../vector/chatVectorStore";
import { prisma, redisClient } from "../config/db.config";
import path from "path";

const saveFile: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    // File will be saved in the uploads folder by multer middleware
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }
    if (req.file.mimetype !== "application/pdf") {
      throw new ApiError(400, "Only PDF files are allowed");
    }

    await redisClient.set(req.file.path, "processing", "EX", 60 * 60); // expire in 1 hour

    res.status(200).json(
      new ApiResponse(200, "File uploaded successfully", {
        filePath: req.file.path,
      }),
    );
  },
);

const processFile: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Invalid request", errors.array());
    }

    const { filePath, chatId } = req.body;

    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      throw new ApiError(404, "File not found");
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
      },
    });

    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }

    const docs = await loadFileFromTmp(filePath);

    await addChatDocuments(docs, chatId);
    await fs.unlink(path.join(__dirname, "../../", filePath));
    await redisClient.set(filePath, "processed", "EX", 60 * 60); // expire in 1 hour

    res.status(200).json(
      new ApiResponse(200, "File processed and added to chat context", {
        chatId,
      }),
    );
  },
);

const fileStatus: RequestHandler = expressAsyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Invalid request", errors.array());
  }
  const { filePath } = req.query;
  const status = await redisClient.get(filePath as string);
  if (!status) {
    throw new ApiError(404, "File not found");
  }
  res.status(200).json(
    new ApiResponse(200, "File status retrieved successfully", {
      filePath,
      status,
    }),
  );
});

export { saveFile, processFile, fileStatus };
