import { Router } from "express";
import {
  getAllUserChats,
  getChatMessages,
} from "../controller/chat.controller";
import { userAuthMiddleware } from "../middleware/userAuth.middleware";

const chatRouter: Router = Router();

chatRouter.use(userAuthMiddleware);

chatRouter.get("/", getAllUserChats);
chatRouter.get("/:chatId", getChatMessages);

export default chatRouter;
