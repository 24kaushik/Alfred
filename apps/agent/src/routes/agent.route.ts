import { Router } from "express";
import { agentController } from "../controllers/agent.controller";
import { body, query } from "express-validator";

const agentRouter: Router = Router();

agentRouter.post(
  "/chat",
  [
    body("message").isString().withMessage("Message must be a string"),
    query("chatId").optional().isUUID().withMessage("Chat ID must be a valid UUID"),
  ],
  agentController,
);

export default agentRouter;
