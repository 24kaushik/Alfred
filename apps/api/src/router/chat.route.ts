import { Router } from "express";
import {
  createNewChat,
  getAllUserChats,
  getChatMessages,
  getFilesInChat,
  sendChatMessage,
  uploadFileToChat,
  createNewStudyChat,
  getAllStudyChats,
} from "../controller/chat.controller";
import { userAuthMiddleware } from "../middleware/userAuth.middleware";
import { body, param, query } from "express-validator";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

const chatRouter: Router = Router();

chatRouter.use(userAuthMiddleware);

chatRouter.get("/", getAllUserChats);
chatRouter.get("/:chatId", getChatMessages);
chatRouter.get("/studychats", getAllStudyChats);

chatRouter.post(
  "/:chatId",
  [
    body("message").isString().withMessage("Message must be a string"),
    body("type")
      .isIn(["chat", "studychat"])
      .withMessage("Type must be either 'chat' or 'studychat'"),
  ],
  sendChatMessage,
);

chatRouter.post("/", createNewChat);
chatRouter.post("/studychats", createNewStudyChat);

chatRouter.get(
  "/files/:chatId",
  [param("chatId").isUUID().withMessage("Invalid chat ID")],
  getFilesInChat,
);
chatRouter.post(
  "/upload/:chatId",
  [param("chatId").isUUID().withMessage("Invalid chat ID")],
  upload.single("file"),
  uploadFileToChat,
);

export default chatRouter;
