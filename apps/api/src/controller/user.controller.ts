import expressAsyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiClasses";
import { RequestHandler } from "express";
import { encrypt } from "@alfred/utils";
import { prisma } from "../config/db.config";

const updateERPCredentials: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, "Validation failed", errors.array());
    }

    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { qid, password } = req.body as { qid: string; password: string };

    const user = await prisma.student.findUnique({
      where: { qid: qid.toString() },
    });

    if (user) {
      throw new ApiError(400, "QID is already associated with another account");
    }

    const encryptedPassword = encrypt(password);

    const updatedUser = await prisma.student.update({
      where: { id: req.user.id },
      data: { qid: qid.toString(), encryptedPassword },
      select: { id: true, email: true, qid: true },
    });

    res.status(200).json({
      message: "ERP credentials updated successfully",
      user: updatedUser,
    });
  },
);

const getUserInfo: RequestHandler = expressAsyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await prisma.student.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      qid: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ user });
});

export { updateERPCredentials, getUserInfo };
