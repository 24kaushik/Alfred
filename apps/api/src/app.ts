import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./types/express.interface"; // Import custom type definitions for Express

// Basic setup
const app: express.Application = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (_, res) => res.send("Alfred api server is running"));

// Routes
import authRouter from "./router/auth.route";
import userRouter from "./router/user.route";
import chatRouter from "./router/chat.route";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);



// Error handling
import errorHandler from "./middleware/errorHandler.middleware";
app.use(errorHandler);

export default app;
