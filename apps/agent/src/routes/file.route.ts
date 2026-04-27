import { Router } from "express";
import multer from "multer";
import {
  saveFile,
  processFile,
  fileStatus,
} from "../controller/file.controller";
import { body, query } from "express-validator";

const fileRouter: Router = Router();

const upload = multer({ dest: "rag_data/tmp" }); // only pdfs

fileRouter.post("/upload", upload.single("file"), saveFile);

fileRouter.post(
  "/process",
  [
    body("filePath").isString().trim().exists(),
    body("chatId").isString().trim().exists(),
  ],
  processFile,
);

fileRouter.get(
  "/status",
  [query("filePath").isString().trim().exists()],
  fileStatus,
);

export default fileRouter;
