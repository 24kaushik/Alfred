import { UUID } from "node:crypto";
import { redisClient } from "../config/db.config";
import { loginService } from "../service/login.service";

export const getCookies = async (userID: UUID): Promise<string> => {
  let cookies = await redisClient.get(`cookies:${userID}`);
  if (!cookies) {
    cookies = await loginService(userID);
    if (cookies) {
      redisClient.set(`cookies:${userID}`, cookies, "EX", 60 * 60 * 1); // Store cookies in Redis with an expiration time of 1 hours
    } else {
      throw new Error("Failed to retrieve cookies for user");
    }
  }

  return cookies;
};
