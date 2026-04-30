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
    let { chatId } = req.query as { chatId: string };
    const { userId } = req.body as { userId: string };

    // Prepare messages
    const currMessage = { role: "user", content: message };
    const prevMessages = await getChatHistory(chatId);
    const allMessages = [...prevMessages, currMessage];

    let agentReply = "";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    for await (const [token, metadata] of await StudyHelpAgent.stream(
      { messages: allMessages },
      { configurable: { userId }, streamMode: "messages" },
    )) {
      const tokenContent = token.contentBlocks[0]?.text || "";
      res.write(tokenContent);
      agentReply += tokenContent;
    }

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
        console.error("Failed to save messages to DB:", err);
      });
    allMessages.push({ role: "ai", content: agentReply });
    await saveChatHistory(chatId, allMessages);
    res.end();
  },
);
