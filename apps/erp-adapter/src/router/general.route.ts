import { Router } from "express";
import { getGeneralDetails } from "../controller/general.controller";
import { param } from "express-validator";

const generalRouter: Router = Router();

generalRouter.get(
  "/:userID",
  param("userID").isUUID().withMessage("Invalid user ID format"),
  getGeneralDetails,
);

export default generalRouter;
