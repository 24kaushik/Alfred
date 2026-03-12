import { RequestHandler } from "express";
import expressAsyncHandler from "express-async-handler";
import qumsClient from "../config/axios.config";
import { header } from "express-validator";
import { getCookies } from "../utils/getCookies";
import { UUID } from "node:crypto";
import { ApiError } from "../utils/ApiClasses";
import { normalizeCirculars } from "../normalizer/circular.normalizer";
import fs from "fs";
import { pdf } from "pdf-to-img";
import { enhanceImage } from "../utils/enhance";
import { extractHinglishText } from "../utils/ocr";

export const getCirculars: RequestHandler = expressAsyncHandler(
  async (req, res) => {
    // Using my own UUID because getting this controller will not only just be called by logged in users, it'll be called by itself as well every night or so for making day plans and risk analysis of circulars messaging automatically.
    const MY_UUID = process.env.MY_UUID as UUID;
    if (!MY_UUID) {
      throw new ApiError(500, "UUID not set in ENV");
    }

    const cookies = await getCookies(MY_UUID);

    const response = await qumsClient.post(
      "/Web_Teaching/GetCircularDetails",
      {},
      {
        headers: {
          Cookie: cookies,
        },
      },
    );
    if (response.status !== 200 || !response.data || !response.data.state) {
      throw new ApiError(500, "Failed to retrieve circular data");
    }

    const circulars = await response.data;
    const formattedData = normalizeCirculars(circulars);

    for (let i = 0; i < 5; i++) {
      const circular = formattedData.circulars?.[i];

      if (!circular) {
        throw new Error("Circular not found");
      }

      const response = await qumsClient.post(
        "/Web_Teaching/GetCircularAllDetails",
        { CirID: circular.id },
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: cookies,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error("Failed to retrieve circular details");
      }

      const base64Circular = JSON.parse(response.data.state)[0].Circular;
      const buffer = Buffer.from(base64Circular, "base64");

      // TODO: Temporarily saving the circular to disk, will send to AI model later
      const docs = await pdf(buffer, { scale: 3 });
      let j = 0;
      let text = "";

      for await (const doc of docs) {
        const img = await enhanceImage(doc);
        text += await extractHinglishText(img);
      }

      fs.writeFileSync(`circular_${circular.id}.txt`, text);
    }

    res.send(200);
  },
);
