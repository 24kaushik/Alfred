import { Router } from "express";
import { userAuthMiddleware } from "../middleware/userAuth.middleware";
import {
  getUserInfo,
  updateERPCredentials,
} from "../controller/user.controller";
import { body } from "express-validator";

const userRouter: Router = Router();

userRouter.use(userAuthMiddleware);

userRouter.get("/me", getUserInfo);
userRouter.put(
  "/update",
  [
    body("qid").isNumeric().withMessage("QID must be a number"),
    body("password").isString().withMessage("Password must be a string"),
  ],
  updateERPCredentials,
);


export default userRouter;