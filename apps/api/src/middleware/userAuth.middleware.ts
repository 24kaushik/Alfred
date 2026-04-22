import type { Request, Response, NextFunction, RequestHandler } from "express";
import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiClasses";

export const userAuthMiddleware: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authToken = req.headers?.authorization
      ? req.headers.authorization.replace("Bearer ", "")
      : req.cookies?.authToken;

    if (!authToken) {
      throw new ApiError(401, "Authentication token is missing");
    }

    const user = await jwt.verify(authToken, process.env.JWT_SECRET!);

    if (!user) {
      throw new ApiError(401, "Invalid authentication token");
    }

    // Attach user info to request object
    req.user = user as { id: string; email: string };
    next();
  },
);
