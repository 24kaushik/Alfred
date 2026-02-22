import type { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _: NextFunction,
) => {
  console.error(err);
  if (err.status) {
    return res.status(err.status).json({
      status: err.status,
      success: false,
      message: err.message,
      data: err.data || {},
      stack: process.env.NODE_ENV === "development" ? err.stack : {},
    });
  } else {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
      data: {},
    });
  }
};

export default errorHandler;
