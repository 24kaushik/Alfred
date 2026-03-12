import { RequestHandler } from "express";
import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { UUID } from "crypto";
import { getCookies } from "../utils/getCookies";
import { prisma } from "@alfred/db";
import qumsClient from "../config/axios.config";
import { generalNormalizer } from "../normalizer/general.normalizer";

const getGeneralDetails: RequestHandler = expressAsyncHandler(
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

    const generalResponse = await qumsClient.post(
      `/Account/GetStudentDetail`,
      {
        RegID: regID,
      },
      {
        headers: {
          Cookie: cookies,
        },
      },
    );

    if (generalResponse.status !== 200 || !generalResponse.data) {
      throw new ApiError(500, "Failed to retrieve general data");
    }

    const formatedData = generalNormalizer(generalResponse.data);

    if (!formatedData) {
      throw new ApiError(500, "Failed to parse general data");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "General details retrieved successfully",
          formatedData,
        ),
      );
  },
);

export { getGeneralDetails };
