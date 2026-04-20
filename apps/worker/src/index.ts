import { Worker } from "bullmq";
import connection from "./redis";
import dotenv from "dotenv";
import getAiResponseAndPublish from "./handler";

dotenv.config();

const worker = new Worker(
  "ai-queue",
  async (job) => {
    if (!job.data.message || !job.data.chatId) {
      return;
    }
    getAiResponseAndPublish(job.data.message, job.data.chatId);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});
