import { createRedisClient, type Redis } from "@alfred/redis";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddingModel } from "./models.config";

export { prisma } from "@alfred/db";

export const redisClient: Redis = createRedisClient();

let vectorStoreQP: QdrantVectorStore | null = null;
let vectorStoreCirculars: QdrantVectorStore | null = null;
let vectorStoreChat: QdrantVectorStore | null = null;

export async function initVectorStores() {
  if (!vectorStoreQP) {
    vectorStoreQP = await QdrantVectorStore.fromExistingCollection(
      embeddingModel,
      {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: "question_papers",
      },
    );
  }

  if (!vectorStoreCirculars) {
    vectorStoreCirculars = await QdrantVectorStore.fromExistingCollection(
      embeddingModel,
      {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: "circulars",
      },
    );
  }

  if (!vectorStoreChat) {
    vectorStoreChat = await QdrantVectorStore.fromExistingCollection(
      embeddingModel,
      {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: "chat",
      },
    );
  }
}

export async function getVectorStores() {
  if (!vectorStoreQP || !vectorStoreCirculars || !vectorStoreChat) {
    await initVectorStores();
  }

  return {
    vectorStoreQP: vectorStoreQP!,
    vectorStoreCirculars: vectorStoreCirculars!,
    vectorStoreChat: vectorStoreChat!,
  };
}
