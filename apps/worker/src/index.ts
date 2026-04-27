import { Worker } from "bullmq";
import connection from "./redis";
import dotenv from "dotenv";
import {getAiResponseAndPublish} from "./handler";

dotenv.config();

const worker = new Worker(
  "ai-queue",
  async (job) => {
    if (!job.data.message || !job.data.reqId || !job.data.userId) {
      if (job.data.reqId) {
        await connection.publish(job.data.reqId, "END");
      }
      return;
    }
    await getAiResponseAndPublish({
      message: job.data.message,
      chatId: job.data.chatId,
      userId: job.data.userId,
      reqId: job.data.reqId,
    });
    await connection.publish(job.data.reqId, "END");
  },
  { connection, concurrency: 1 }, // Process one job at a time due to current AI server limitations. Increase if better ai servers are available in the future.
);

// TODO: add file processing worker 

worker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});
