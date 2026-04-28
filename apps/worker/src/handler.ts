import axios from "axios";
import connection from "./redis";
import { Readable } from "stream";

type PublishEvent =
  | { type: "token"; data: string }
  | { type: "end" }
  | { type: "error"; data?: any };

const publish = (reqId: string, payload: PublishEvent) => {
  connection.publish(reqId, JSON.stringify(payload));
};

const getAiResponseAndPublish = async ({
  message,
  chatId,
  userId,
  reqId,
}: {
  message: string;
  chatId?: string;
  userId: string;
  reqId: string;
}) => {
  try {
    const url = chatId
      ? `${process.env.AGENT_URL}/agent/general/chat?chatId=${chatId}`
      : `${process.env.AGENT_URL}/agent/general/chat`;

    const response = await axios.post(
      url,
      { message, userId },
      {
        responseType: "stream",
        timeout: 30000,
        validateStatus: () => true, // allow non-2xx responses
      },
    );

    const contentType = response.headers["content-type"] || "";

    // ---- CASE 1: JSON (error or non-stream response) ----
    if (contentType.includes("application/json")) {
      const chunks: Buffer[] = [];

      for await (const chunk of response.data as Readable) {
        chunks.push(chunk);
      }

      const body = Buffer.concat(chunks).toString();

      try {
        const parsed = JSON.parse(body);

        publish(reqId, {
          type: "error",
          data: parsed,
        });
      } catch {
        publish(reqId, {
          type: "error",
          data: { message: "Invalid JSON response from upstream" },
        });
      }

      return;
    }

    // ---- CASE 2: STREAM ----
    const stream = response.data as Readable;

    stream.on("data", (chunk: Buffer) => {
      try {
        const token = chunk.toString();

        publish(reqId, {
          type: "token",
          data: token,
        });
      } catch (err) {
        console.error("Chunk parse error:", err);
      }
    });

    stream.on("end", () => {
      publish(reqId, { type: "end" });
      stream.removeAllListeners();
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      publish(reqId, {
        type: "error",
        data: { message: "Stream failure" },
      });
      stream.destroy();
    });

    stream.on("close", () => {
      stream.removeAllListeners();
    });
  } catch (err: any) {
    console.error("Request failed:", err?.message);

    publish(reqId, {
      type: "error",
      data: { message: "Upstream request failed" },
    });
  }
};

const processFile = async ({
  fileUrl,
  chatId,
}: {
  fileUrl: string;
  chatId: string;
}) => {
  const response = await axios.post(`${process.env.AGENT_URL}/file/process`, {
    fileUrl,
    chatId,
  });

  return response.data;
};

export { getAiResponseAndPublish, processFile };
