import express from "express";
import type { Express } from "express";
import dotenv from "dotenv";

//temp imports for testing
import { loginService } from "./service/login.service";
import { redisClient } from "./config/db.config";

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
app.use("/attendance", attendanceRouter);
app.use("/timetable", timetableRouter);

// temp testing login service
// (async () => {
//   const userID = "cee90619-e393-484b-ae7e-ecb100c2bee1";
//   const cookies = await loginService(userID);
//   if (cookies) {
//     redisClient.set(`cookies:${userID}`, cookies, "EX", 60 * 60 * 24); // Store cookies in Redis with an expiration time of 24 hours
//   }
// })();

// Error handling middleware
import errorHandler from "./middleware/errorHandler.middleware";
app.use(errorHandler);

export default app;
