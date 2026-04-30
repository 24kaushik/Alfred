import { Router } from "express";
import {
  getAllUserChats,
  getChatMessages,
  sendChatMessage,
} from "../controller/chat.controller";
import { userAuthMiddleware } from "../middleware/userAuth.middleware";
import { body, query } from "express-validator";

const chatRouter: Router = Router();

chatRouter.use(userAuthMiddleware);

chatRouter.get("/", getAllUserChats);
chatRouter.get("/:chatId", getChatMessages);

chatRouter.post("/:chatId",[
  body("message").isString().withMessage("Message must be a string"),
  body("type")
    .isIn(["chat", "studychat"])
    .withMessage("Type must be either 'chat' or 'studychat'"),
], sendChatMessage);
chatRouter.post("/", [
  body("message").isString().withMessage("Message must be a string"),
  body("type")
    .isIn(["chat", "studychat"])
    .withMessage("Type must be either 'chat' or 'studychat'"),
], sendChatMessage); // also create a new chat if chatId is not provided

export default chatRouter;
