import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { ApiError, ApiResponse } from "../utils/ApiClasses";
import { getCookies } from "../utils/getCookies";
import { UUID } from "crypto";
import qumsClient from "../config/axios.config";
import {
  normalizeSubjects,
  normalizeSubjectUnits,
} from "../normalizer/syllabus.normalizer";
import { RequestHandler } from "express";

const getSubjects: RequestHandler = expressAsyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation Error", errors.array());
  }

  const { userID } = req.params as { userID: UUID };

  const cookies = await getCookies(userID);

  const response = await qumsClient.post(
    `/Web_StudentAcademic/GetStudentSubject`,
    {},
    {
      headers: {
        Cookie: cookies,
      },
    },
  );

  if (response.status !== 200 || !response.data) {
    throw new ApiError(500, "Failed to retrieve syllabus data");
  }

  const formatedData = normalizeSubjects(response.data);

  if (!formatedData) {
    throw new ApiError(500, "Failed to parse syllabus data");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Syllabus data retrieved successfully",
        formatedData,
      ),
    );
});

const getSyllabus: RequestHandler = expressAsyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation Error", errors.array());
  }

  const { userID } = req.params as { userID: UUID };
  const { subjectID } = req.body as { subjectID: string };

  const cookies = await getCookies(userID);

  // WHY TF WOULD YOU DO THAT? retards
  const formData = new FormData();
  formData.append("param", "0");
  formData.append("param", "0");
  formData.append("param", "0");
  formData.append("param", "0");
  formData.append("param", "0");
  formData.append("param", subjectID);
  formData.append("param", "0");

  const response = await qumsClient.post("/SMSReport/ShowReport", formData, {
    headers: {
      Cookie: cookies,
    },
  });


  if (response.status !== 200 || !response.data) {
    throw new ApiError(500, "Failed to retrieve syllabus data");
  }

  const formatedData = normalizeSubjectUnits(response.data);

  if (!formatedData) {
    throw new ApiError(500, "Failed to parse syllabus data");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Syllabus data retrieved successfully",
        formatedData,
      ),
    );
});

export { getSubjects, getSyllabus };
