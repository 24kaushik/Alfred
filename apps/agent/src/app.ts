import express, { type Express } from "express";

const app: Express = express();
app.use(express.json());

// Health check endpoint
app.get("/", (_, res) => {
  res.send("Agent server is running.");
});

import agentRouter from "./routes/agent.route";
app.use("/agent", agentRouter);

export default app;
