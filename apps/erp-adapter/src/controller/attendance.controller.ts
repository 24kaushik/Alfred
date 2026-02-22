import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { prisma, redisClient } from "../config/db.config";
import { loginService } from "../service/login.service";
import { UUID } from "node:crypto";
import qumsClient from "../config/axios.config";
import { structureAttendance } from "../normalizer/attendance.normalizer";

export const getMonthlyAttendance: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { month } = req.body;
    const { userID } = req.params as { userID: UUID };

    let cookies = await redisClient.get(`cookies:${userID}`);

    if (!cookies) {
      cookies = await loginService(userID);
      if (cookies) {
        redisClient.set(`cookies:${userID}`, cookies, "EX", 60 * 60 * 24); // Store cookies in Redis with an expiration time of 24 hours
      } else {
        throw new ApiError(500, "Failed to retrieve cookies for user");
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: userID },
    });

    if (!student) {
      throw new ApiError(404, "User not found");
    }

    const regID = student.regID;
    if (!regID) {
      throw new ApiError(400, "User does not have a registration ID");
    }

    const attendanceResponse = await qumsClient.post(
      `/Web_StudentAcademic/GetMonthRegister`,
      {
        RegID: regID,
        Month: month,
      },
      {
        headers: {
          Cookie: cookies,
        },
      },
    );

    if (attendanceResponse.status !== 200 || !attendanceResponse.data) {
      throw new ApiError(500, "Failed to retrieve attendance data");
    }

    const formattedData = structureAttendance(attendanceResponse.data);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Attendance data retrieved successfully",
          formattedData,
        ),
      );
  },
);
