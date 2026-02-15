import e from "express";

class ApiResponse {
  success: boolean;
  status: number;
  message: string;
  data?: any;

  constructor(status: number, message: string, data: any = null) {
    this.success = status >= 200 && status < 300;
    this.status = status;
    this.message = message;
    data && (this.data = data);
  }
}

class ApiError extends Error {
  status: number;
  message: string;
  data?: any;
  stack?: string;

  constructor(
    status: number,
    message: string,
    data: any = null,
    stack: string = "",
  ) {
    super(message);
    this.status = status;
    this.message = message;
    data && (this.data = data);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiResponse, ApiError };
