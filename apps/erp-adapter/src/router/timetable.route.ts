import { Router } from "express";
import { param, query } from "express-validator";

import { getTimetable } from "../controller/timetable.controller";

const timetableRouter: Router = Router();

timetableRouter.get(
  "/:userID",
  [
    param("userID").isUUID().withMessage("Invalid user ID"),
    query("day")
      .optional()
      .toLowerCase()
      .isIn([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .withMessage("Invalid day"),
  ],
  getTimetable,
);

export default timetableRouter;
