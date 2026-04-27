import express, { type Express } from "express";

const app: Express = express();
app.use(express.json());

// Health check endpoint
app.get("/", (_, res) => {
  res.send("Agent server is running.");
});

import agentRouter from "./routes/agent.route";
import fileRouter from "./routes/file.route";
app.use("/agent", agentRouter);
app.use("/file", fileRouter);

// Error handling middleware
import errorHandler from "./middleware/errorHandler.middleware";
app.use(errorHandler);

export default app;

// TODO: Circulars RAG remaining
