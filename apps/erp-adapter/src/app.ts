import express from "express";
import type { Express } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("ERP adapter working!");
});

// Routes
import attendanceRouter from "./router/attendance.route";
import timetableRouter from "./router/timetable.route";
import circularRouter from "./router/circular.route";
import generalRouter from "./router/general.route";

app.use("/attendance", attendanceRouter);
app.use("/timetable", timetableRouter);
app.use("/circular", circularRouter);
app.use("/general", generalRouter);

// Error handling middleware
import errorHandler from "./middleware/errorHandler.middleware";
app.use(errorHandler);

export default app;
