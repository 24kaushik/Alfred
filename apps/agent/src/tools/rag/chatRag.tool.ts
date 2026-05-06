// TODO: Allow user to upload files and question based on that.

import * as z from "zod";
import { tool } from "langchain";
import { searchChatDocuments } from "../../vector/chatVectorStore";

const ChatRagInputSchema = z.object({
  query: z.string(),
});

const ChatRagLogic = async ({
  query,
  chatId,
}: z.infer<typeof ChatRagInputSchema> & { chatId: string }) => {
  const searchResults = await searchChatDocuments(query, chatId);
  if (searchResults.length === 0) {
    return "No relevant information found in the uploaded files.";
  }

  return `Here are some relevant pieces of information from the uploaded files:\n\n${searchResults.join(
    "\n\n",
  )}`;
};

// add chatId from config metadata

const wrapChatRagLogic = (toolFn: Function) => {
  return async (input: any, config: { metadata?: { chatId?: string } }) => {
    if (!config.metadata || !config.metadata.chatId) {
      throw new Error("Chat ID is required in tool metadata");
    }
    return toolFn({ ...input, chatId: config.metadata.chatId });
  };
};

export const ChatRagTool = tool(wrapChatRagLogic(ChatRagLogic), {
  name: "chat-rag-tool",
  description:
    "A tool to retrieve info from the files uploaded by the user in this chat. write a well query that might be present in the file to get the best results. dont send filename etc in the query, just the content you want to search",
  schema: ChatRagInputSchema,
});
