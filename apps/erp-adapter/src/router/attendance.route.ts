import { Router } from "express";
import { body, param } from "express-validator";
import { getMonthlyAttendance } from "../controller/attendance.controller";

const attendanceRouter: Router = Router();

attendanceRouter.post(
  "/monthly/:userID",
  [
    body("month")
      .isInt({ min: 1, max: 12 })
      .withMessage("Month must be an integer between 1 and 12"),
    param("userID").isUUID().withMessage("Invalid user ID"),
  ],
  getMonthlyAttendance,
);

export default attendanceRouter;
