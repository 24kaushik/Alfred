import { Worker } from "bullmq";
import connection from "./redis";
import dotenv from "dotenv";
import { getAiResponseAndPublish, processFile } from "./handler";

dotenv.config();

const worker = new Worker(
  "ai-queue",
  async (job) => {
    if (!job.data.message || !job.data.reqId || !job.data.userId) {
      if (job.data.reqId) {
        await connection.publish(job.data.reqId, "--![END]!--");
      }
      return;
    }
    await getAiResponseAndPublish({
      message: job.data.message,
      chatId: job.data.chatId,
      userId: job.data.userId,
      reqId: job.data.reqId,
      type: job.data.type,
    });
  },
  { connection, concurrency: 1 }, // Process one job at a time due to current AI server limitations. Increase if better ai servers are available in the future.
);

const processFileWorker = new Worker(
  "process-queue",
  async (job) => {
    await processFile({
      filePath: job.data.filePath,
      chatId: job.data.chatId,
    });
    await connection.publish(job.data.reqId, "--![END]!--");
  },
  { connection, concurrency: 1 },
);

processFileWorker.on("completed", (job) => {
  console.log(`${job.id} has completed! -- File Processing`);
});

worker.on("completed", (job) => {
  console.log(`${job.id} has completed! -- AI Response Generation`);
});
