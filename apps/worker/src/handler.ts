import axios from "axios";
import connection from "./redis";

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
  let response;
  if (chatId) {
    response = await axios.post(
      `${process.env.AGENT_URL}/agent/general/chat?chatId=${chatId}`,
      { message, userId },
      // { responseType: "stream" } // TODO: Handle streaming response from agent service
    );
  } else {
    response = await axios.post(
      `${process.env.AGENT_URL}/agent/general/chat`,
      { message, userId },
      // { responseType: "stream" } // TODO: Handle streaming response from agent service
    );
  }

  connection.publish(reqId, JSON.stringify(response.data));
};



export { getAiResponseAndPublish };
