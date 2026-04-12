import * as z from "zod";
import { tool } from "langchain";
import { loadQuestionPapers } from "../../utils/pdfLoader";
import {
  addQuestionPapers,
  searchQuestionPapers,
} from "../../vector/qpVectorStore";

export const ingestQuestionPapers = async () => {
  const questionPapers = await loadQuestionPapers();

  const BATCH_SIZE = 50;

  for (let i = 0; i < questionPapers.length; i += BATCH_SIZE) {
    const batch = questionPapers.slice(i, i + BATCH_SIZE);
    await addQuestionPapers(batch);
    console.log(`Ingested batch ${i / BATCH_SIZE + 1}`);
  }
  console.log("Finished ingesting question papers.");
};

export const retrieveQuestionPapers = async (query: string) => {
  const results = await searchQuestionPapers(query);
  return results;
};

const RetrieveQuestionPapersToolSchema = z.string();

const RetrieveQuestionPapersTool = tool(retrieveQuestionPapers, {
  name: "retrieve_question_papers",
  description:
    "Searches for relevant question papers based on the provided query and returns the most relevant results.",
  schema: RetrieveQuestionPapersToolSchema,
});

export default RetrieveQuestionPapersTool;
