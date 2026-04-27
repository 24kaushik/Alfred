import { Queue } from "bullmq";

export const AI_QUEUE = new Queue("ai-queue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

export const addToAIQueue = async ({
  message,
  chatId,
  userId,
  reqId,
}: {
  message: string;
  chatId?: string;
  userId: string;
  reqId: string;
}) => {
  await AI_QUEUE.add("job", { message, chatId, userId, reqId });
};

export const PROCESS_QUEUE = new Queue("process-queue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

export const addToProcessQueue = async ({
  filePath,
  chatId,
}: {
  filePath: string;
  chatId: string;
}) => {
  await PROCESS_QUEUE.add("job", { filePath, chatId });
};
