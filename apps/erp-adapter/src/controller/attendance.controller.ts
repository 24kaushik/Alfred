import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { prisma } from "../config/db.config";
import { UUID } from "node:crypto";
import qumsClient from "../config/axios.config";
import {
  normalizeDailyAttendance,
  normalizeSemWiseAttendance,
  structureAttendance,
} from "../normalizer/attendance.normalizer";
import { getCookies } from "../utils/getCookies";

export const getMonthlyAttendance: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { month } = req.body;
    const { userID } = req.params as { userID: UUID };

    let cookies = await getCookies(userID);

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

export const getDailyAttendance: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { userID } = req.params as { userID: UUID };

    let cookies = await getCookies(userID);

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

    // Date in DD/MM/YYYY format
    const attendanceResponse = await qumsClient.post(
      "/Web_StudentAcademic/GetTodayAttendance",
      {
        RegID: regID,
        // date: new Date().toLocaleDateString("en-GB"),
        date: "21/02/2026",
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

    const formattedData = normalizeDailyAttendance(attendanceResponse.data);

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

export const getSemAttendance: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation error", errors.array());
    }

    const { userID } = req.params as { userID: UUID };

    let cookies = await getCookies(userID);

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

    const semResp = await qumsClient.post(
      "/Web_StudentAcademic/GetStudentInformation",
      {
        RegID: regID,
      },
      {
        headers: {
          Cookie: cookies,
        },
      },
    );

    if (semResp.status !== 200 || !semResp.data || !semResp.data.state) {
      throw new ApiError(500, "Failed to retrieve semester data");
    }

    const sem = JSON.parse(semResp.data.state)[0]?.YearSem;
    if (!sem) {
      throw new ApiError(500, "Semester information not found");
    }

    const attendanceResponse = await qumsClient.post(
      "/Web_StudentAcademic/GetYearSemWiseAttendance",
      {
        RegID: regID,
        YearSem: sem,
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

    const formattedData = normalizeSemWiseAttendance(attendanceResponse.data);

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
