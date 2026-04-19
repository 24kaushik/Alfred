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
}: {
  message: string;
  chatId: string;
}) => {
  await AI_QUEUE.add("job", { message, chatId });
};
