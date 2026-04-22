import type { Response, Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export type { Response, Request };
