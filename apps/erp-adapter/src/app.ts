import express from "express";
import type { Express } from "express";
// import loginRouter from "./router/login.route";
import {prisma} from "@alfred/db";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();

// // Health check
// app.get("/", (req, res) => {
//   res.send("ERP adapter working!");
// });

// // Routes
// app.use("/login", loginRouter);



export default app;
