import type { UUID } from "crypto";
import { prisma } from "../config/db.config";
import { ApiError } from "../utils/ApiClasses";
import { enhanceImage } from "../utils/enhance";
import { extractText } from "../utils/ocr";
import client from "../config/axios.config";

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
  const decryptedPassword = user.encryptedPassword;
  // Replace with actual decryption logic
  // better yet, dont store it in memory at all, directly use it to login and then clear it from memory

  for (let attempt = 1; attempt <= 5; attempt++) {
    const { cookies, reqVerificationToken } =
      await getCookiesAndRequestVerificationToken(userID);

    if (!cookies || !reqVerificationToken) {
      throw new ApiError(
        500,
        "Failed to retrieve cookies or request verification token",
      );
    }

    const captchaText = await getCaptchaText(cookies);

    const formdata = new FormData();
    formdata.append("UserName", user.qid);
    formdata.append("Password", decryptedPassword);
    formdata.append("captcha", captchaText.trim());
    formdata.append("__RequestVerificationToken", reqVerificationToken);
    formdata.append("hdnMsg", "QGC");
    formdata.append("checkOnline", "0");

    const loginResponse = await client.post("/", formdata, {
      headers: {
        Cookie: cookies,
      },
    });

    if (loginResponse.data.includes("Captcha does not match")) {
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

      if (!user.regID) {
        const regID = await getRegId(cookies);
        if (regID) {
          await prisma.student.update({
            where: { id: userID },
            data: { regID },
          });
        }
      }

      return cookies;
    }
  }

  return null;
};

const getRegId = async (cookies: string): Promise<string> => {
  const response = await client.post(
    "/Account/GetStudentDetail",
    {},
    {
      headers: {
        Cookie: cookies,
      },
    },
  );
  if (
    response.status !== 200 ||
    !response.data ||
    response.data.state === "[]"
  ) {
    throw new ApiError(500, "Failed to fetch Reg ID.");
  }

  const state = JSON.parse(response.data.state)[0];
  const regID: number = state.RegID;
  if (regID == null || regID == undefined) {
    throw new ApiError(500, "Reg ID not found in response.");
  }
  return regID.toString();
};

const getCookiesAndRequestVerificationToken = async (
  userID: UUID,
): Promise<{ cookies: string; reqVerificationToken: string }> => {
  const indexPage = await client.get("/");

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

  return { cookies, reqVerificationToken };
};

const getCaptchaText = async (cookies: string): Promise<string> => {
  const captcha = await client.post(
    "/Account/showcaptchaImage",
    {},
    {
      headers: {
        Cookie: cookies,
      },
    },
  );

  const enhancedImage = await enhanceImage(new Uint8Array(captcha.data));
  const captchaText = await extractText(enhancedImage);
  return captchaText.trim();
};
