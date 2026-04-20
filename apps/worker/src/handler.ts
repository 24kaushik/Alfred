import axios from "axios";
import connection from "./redis";

const getAiResponseAndPublish = async (message: string, chatId: string) => {
  const response = await axios.post(
    `${process.env.AGENT_URL}/agent/general/chat?chatId=${chatId}`,
    { message },
    // { responseType: "stream" } // TODO: Handle streaming response from agent service
  );

  connection.publish(chatId, JSON.stringify(response.data));
};

export default getAiResponseAndPublish;
