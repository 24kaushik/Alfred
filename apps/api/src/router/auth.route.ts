import { Router } from "express";
import { googleOAuth } from "../controller/auth.controller";
import { body } from "express-validator";

const router: Router = Router();

router.post(
  "/google",
  body("code").notEmpty().withMessage("code is required"),
  googleOAuth,
);

export default router;
