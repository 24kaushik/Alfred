import type { UUID } from "crypto";
import axios from "axios";
import { prisma } from "@alfred/db";
import { ApiError } from "../utils/ApiClasses";
import { enhanceImage } from "../utils/enhance";
import { extractText } from "../utils/ocr";

export const loginService = async (userID: UUID): Promise<string | null> => {
  const user = await prisma.student.findUnique({
    where: {
      id: userID,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.encryptedPassword || !user.qid) {
    throw new ApiError(400, "User does not have credentials set");
  }

  //TODO: decrypt the password
  const decryptedPassword = user.encryptedPassword; // Replace with actual decryption logic
  // better yet, dont store it in memory at all, directly use it to login and then clear it from memory

  for (let attempt = 1; attempt <= 3; attempt++) {
    const indexPage = await axios.get("https://qums.quantumuniversity.edu.in/");

    if (!indexPage.headers["set-cookie"]) {
      throw new ApiError(500, "Failed to get cookies from the server");
    }

    const cookies: string = indexPage.headers["set-cookie"].join("; ");
    const reqVerificationToken = indexPage.data.match(
      /<input name="__RequestVerificationToken" type="hidden" value="([^"]+)" \/>/,
    )?.[1];

    if (!reqVerificationToken) {
      throw new ApiError(
        500,
        "Failed to extract __RequestVerificationToken from cookies",
      );
    }

    const captcha = await axios.post(
      "https://qums.quantumuniversity.edu.in/Account/showcaptchaImage",
      {},
      {
        headers: {
          Cookie: cookies,
        },
      },
    );

    const enhancedImage = await enhanceImage(new Uint8Array(captcha.data));
    const captchaText = await extractText(enhancedImage);

    const formdata = new FormData();
    formdata.append("UserName", user.qid);
    formdata.append("Password", decryptedPassword);
    formdata.append("captcha", captchaText.trim());
    formdata.append("__RequestVerificationToken", reqVerificationToken);
    formdata.append("hdnMsg", "QGC");
    formdata.append("checkOnline", "0");

    const loginResponse = await axios.post(
      "https://qums.quantumuniversity.edu.in/",
      formdata,
      {
        headers: {
          Cookie: cookies,
        },
      },
    );

    if (!loginResponse.data.includes("Captcha does not match")) {
      console.log("Login failed! Captcha does not match", captchaText);
      continue;
    } else if (
      loginResponse.data.includes(
        "The user name or password provided is incorrect.",
      )
    ) {
      throw new ApiError(401, "Login failed! Incorrect username or password");
    } else {
      console.log("Login successful!");
      return cookies;
    }
  }

  return null;
};
