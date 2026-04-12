import { getVectorStores } from "../config/db.config";
import crypto from "crypto";

function generateId(doc: any) {
  const content = doc.pageContent + (doc.metadata?.filename || "");
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join("-");
}

async function getQPStore() {
  const { vectorStoreQP } = await getVectorStores();
  return vectorStoreQP;
}

export async function addQuestionPapers(docs: any[]) {
  const store = await getQPStore();

  const docsWithIds = docs.map((doc) => ({
    ...doc,
    id: generateId(doc),
  }));

  return store.addDocuments(docsWithIds);
}

export async function searchQuestionPapers(query: string, k = 5) {
  const store = await getQPStore();
  const results = await store.similaritySearch(query, k);
  const formattedResults = results.map(
    (result) =>
      `Filename: ${result.metadata.filename}\nContent: ${result.pageContent}`,
  );
  return formattedResults;
}
