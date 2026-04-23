import { Router } from "express";
import {
  getAllUserChats,
  getChatMessages,
  sendChatMessage,
} from "../controller/chat.controller";
import { userAuthMiddleware } from "../middleware/userAuth.middleware";

const chatRouter: Router = Router();

chatRouter.use(userAuthMiddleware);

chatRouter.get("/", getAllUserChats);
chatRouter.get("/:chatId", getChatMessages);

chatRouter.post("/:chatId", sendChatMessage);
chatRouter.post("/", sendChatMessage); // also create a new chat if chatId is not provided

export default chatRouter;
