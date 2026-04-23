import { Router } from "express";
import { agentController } from "../controller/agent.controller";
import { body, header, query } from "express-validator";
import { studyAgentController, updateQP } from "../controller/studyHelp.controller";

const agentRouter: Router = Router();

agentRouter.post(
  "/general/chat",
  [
    body("message").isString().withMessage("Message must be a string"),
    body("userId").isUUID().withMessage("User ID must be a valid UUID"), 
    query("chatId")
      .optional()
      .isUUID()
      .withMessage("Chat ID must be a valid UUID"),
  ],
  agentController,
);

agentRouter.post(
  "/updateQP",
  header("auth").exists().withMessage("Auth header is required"),
  updateQP,
);

agentRouter.post(
  "/study/chat",
  [
    body("message").isString().withMessage("Message must be a string"),
    query("chatId")
      .optional()
      .isUUID()
      .withMessage("Chat ID must be a valid UUID"),
  ],
  studyAgentController,
);

export default agentRouter;
