import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { prisma } from "../config/db.config";
import { UUID } from "node:crypto";
import qumsClient from "../config/axios.config";
import { getCookies } from "../utils/getCookies";
import { normalizeTimetable } from "../normalizer/timetable.normalizer";

export const getTimetable: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    const { userID } = req.params as { userID: UUID };
    const { day } = req.query as { day: string };

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

    const timetableResponse = await qumsClient.post(
      "/Web_StudentAcademic/FillStudentTimeTable",
      {
        RegID: regID,
      },
      {
        headers: {
          Cookie: cookies,
        },
      },
    );

    if (timetableResponse.status !== 200 || !timetableResponse.data) {
      throw new ApiError(500, "Failed to retrieve timetable data");
    }

    const formattedData = normalizeTimetable(timetableResponse.data);
    const dayWiseData = formattedData.filter(
      (entry) => entry.day.toLowerCase() === day.toLowerCase(),
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Day-wise timetable retrieved successfully",
          dayWiseData,
        ),
      );
  },
);
