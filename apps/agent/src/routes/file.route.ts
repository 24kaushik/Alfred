import { Router } from "express";
import multer from "multer";
import {
  saveFile,
  processFile,
  fileStatus,
} from "../controller/file.controller";
import { body, param, query } from "express-validator";

const fileRouter: Router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "rag_data/tmp");
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const nameWithoutExt = file.originalname.split(".").slice(0, -1).join(".");
    const ext = file.originalname.split(".").pop();
    cb(null, `${nameWithoutExt}_${timestamp}.${ext}`);
  },
});

const upload = multer({ storage }); // only pdfs

fileRouter.post(
  "/upload/:chatId",
  upload.single("file"),
  [param("chatId").isString().trim().exists()],
  saveFile,
);

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
