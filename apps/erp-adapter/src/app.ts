import express from "express";
import type { Express } from "express";
import dotenv from "dotenv";
import { loginService } from "./service/login.service";

dotenv.config();

const app: Express = express();

// Health check
app.get("/", (req, res) => {
  res.send("ERP adapter working!");
});

// Routes
loginService("cee90619-e393-484b-ae7e-ecb100c2bee1");


export default app;
