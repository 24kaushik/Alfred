import { redisClient } from "../config/db.config";

// save last 10 messages of the chat history in Redis to maintain context for the agent
export const saveChatHistory = async (chatID: string, messages: any[]) => {
  try {
    await redisClient.set(
      chatID,
      JSON.stringify(messages.slice(-10)),
      "EX",
      60 * 30,
    );
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

// retrieve chat history from Redis
export const getChatHistory = async (chatID: string) => {
  try {
    const history = await redisClient.get(chatID);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error retrieving chat history:", error);
    return [];
  }
};
