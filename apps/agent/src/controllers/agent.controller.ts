import type { Request, Response, RequestHandler } from "express";
import { ApiResponse, ApiError } from "../utils/ApiClasses";
import { validationResult } from "express-validator";
import expressAsyncHandler from "express-async-handler";
import { randomUUID } from "crypto";

export const agentController: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const validationResults = validationResult(req);
    if (!validationResults.isEmpty()) {
      throw new ApiError(400, "Validation failed", validationResults.array());
    }

    const { message } = req.body;
    let { chatId } = req.query;

    if (!chatId) {
      chatId = randomUUID();
    }

    const responseMessage = `Agent received: ${message}; chatId: ${chatId}`;

    // TODO: Implement actual agent logic here
    res.json({ response: responseMessage });
  },
);
