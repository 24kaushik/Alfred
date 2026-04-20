import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Basic setup
const app: express.Application = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (_, res) => res.send("Alfred api server is running"));

// Routes


// Error handling
import errorHandler from "./middleware/errorHandler.middleware";
app.use(errorHandler);

export default app;
