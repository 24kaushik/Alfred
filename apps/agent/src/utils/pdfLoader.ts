import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import path from "path";

const QP_DIR_PATH = path.resolve(__dirname, "../../rag_data/question_papers");

const directoryLoader = new DirectoryLoader(QP_DIR_PATH, {
  ".pdf": (path: string) =>
    new PDFLoader(path, {
      splitPages: false,
    }),
});

export const loadQuestionPapers = async () => {
  const docs = await directoryLoader.load();
  return docs;
};
