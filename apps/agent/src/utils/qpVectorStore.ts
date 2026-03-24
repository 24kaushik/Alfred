import { file } from "zod";
import { getVectorStores } from "../config/db.config";

async function getQPStore() {
  const { vectorStoreQP } = await getVectorStores();
  return vectorStoreQP;
}

export async function addQuestionPapers(docs: any[]) {
  const store = await getQPStore();
  return store.addDocuments(docs);
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
