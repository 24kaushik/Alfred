import type { Request, Response, RequestHandler } from "express";
import { ApiResponse, ApiError } from "../utils/ApiClasses";
import { validationResult } from "express-validator";
import expressAsyncHandler from "express-async-handler";
import { randomUUID } from "crypto";
import erpAgent from "../agent/erp.agent";
import { getChatHistory, saveChatHistory } from "../utils/chatHistoryManager";
import { prisma } from "../config/db.config";

export const agentController: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    // Validate request body
    const validationResults = validationResult(req);
    if (!validationResults.isEmpty()) {
      throw new ApiError(400, "Validation failed", validationResults.array());
    }

    const { message } = req.body;
    let { chatId } = req.query as { chatId?: string };
    const userId = "cee90619-e393-484b-ae7e-ecb100c2bee1"; // TODO TEMP

    // Create chat if doesn't exist
    if (!chatId) {
      const chat = await prisma.chat.create({
        data: {
          studentId: userId,
        },
      });
      chatId = chat.id;
    }

    // Prepare messages
    const currMessage = { role: "user", content: message };
    const prevMessages = await getChatHistory(chatId as string);
    const allMessages = [...prevMessages, currMessage];

    const agentResponse = await erpAgent.invoke(
      { messages: allMessages },
      { configurable: { userId } }, // TODO TEMP
    );

    const agentReply =
      agentResponse.messages[agentResponse.messages.length - 1]?.content;

    if (!agentReply) {
      throw new ApiError(500, "Agent failed to generate a response");
    }

    // Save chat history
    prisma.message
      .createMany({
        data: [
          {
            chatId: chatId,
            sender: "STUDENT",
            content: message,
          },
          {
            chatId: chatId,
            sender: "AGENT",
            content: agentReply as string,
          },
        ],
      })
      .catch((err) => console.error("Failed to save messages to DB:", err));
    allMessages.push({ role: "ai", content: agentReply });
    await saveChatHistory(chatId as string, allMessages);

    res.json(
      new ApiResponse(200, "Agent response generated successfully", {
        chatId,
        reply: agentReply,
      }),
    );
  },
);
