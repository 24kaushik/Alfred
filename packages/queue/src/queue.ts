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

const UPLOAD_QUEUE = new Queue("upload-queue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

export const addToUploadQueue = async ({
  filePath,
  userId
}: {
  filePath: string;
  userId: string;
}) => {
  await UPLOAD_QUEUE.add("job", { filePath, userId });
};