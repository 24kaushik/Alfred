import type { Document } from "@langchain/core/documents";
import { getVectorStores } from "../config/db.config";

async function getChatStore() {
  const { vectorStoreChat } = await getVectorStores();
  return vectorStoreChat;
}

export async function addChatDocuments(content: Document[], chatId: string) {
  const store = await getChatStore();
  return store.addDocuments(
    content.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        chatId,
      },
    })),
  );
}

export async function searchChatMessages(query: string, chatId: string, k = 5) {
  const store = await getChatStore();
  const retriever = store.asRetriever({
    k: 5,
    filter: {
      must: [{ key: "chat_id", match: { value: chatId } }],
    },
  });
  const searchResults = await retriever.invoke(query);
  const formattedResults = searchResults.map(
    (result) =>
      `Filename: ${result.metadata.filename}\nContent: ${result.pageContent}`,
  );
  return formattedResults;
}
