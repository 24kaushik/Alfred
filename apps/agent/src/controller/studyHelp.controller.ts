import expressAsyncHandler from "express-async-handler";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { validationResult } from "express-validator";
import { ingestQuestionPapers } from "../tools/rag/qp.tool";
import { RequestHandler } from "express";
import { prisma } from "../config/db.config";
import { getChatHistory, saveChatHistory } from "../utils/chatHistoryManager";
import StudyHelpAgent from "../agent/rag.agent";

export const updateQP: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation Error", errors.array());
    }

    const { auth } = req.headers;
    if (!auth || auth !== process.env.AUTH_SECRET) {
      throw new ApiError(401, "Unauthorized");
    }

    await ingestQuestionPapers();

    res.json(new ApiResponse(200, "Question papers updated successfully"));
  },
);

export const studyAgentController: RequestHandler = expressAsyncHandler(
  async (req, res) => {
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

    const agentResponse = await StudyHelpAgent.invoke(
      { messages: allMessages },
      { configurable: { userId } },
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
      .catch((err) => {
        console.error("Failed to save chat history:", err);
      });
    allMessages.push({ role: "ai", content: agentReply });
    await saveChatHistory(chatId as string, allMessages);

    res.json(new ApiResponse(200, "Success", { reply: agentReply, chatId }));
  },
);
