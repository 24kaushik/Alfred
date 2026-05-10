import { Router } from "express";
import { googleOAuth, logout } from "../controller/auth.controller";
import { body } from "express-validator";

const router: Router = Router();

router.post(
  "/google",
  body("code").notEmpty().withMessage("code is required"),
  googleOAuth,
);
router.post("/logout", logout);

export default router;
